# frozen_string_literal: true

#
# Copyright (C) 2026 - present Instructure, Inc.
#
# This file is part of Canvas.
#
# Canvas is free software: you can redistribute it and/or modify it under
# the terms of the GNU Affero General Public License as published by the Free
# Software Foundation, version 3 of the License.
#
# Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
# WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
# A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
# details.
#
# You should have received a copy of the GNU Affero General Public License along
# with this program. If not, see <http://www.gnu.org/licenses/>.

require "json"
require "net/http"
require "uri"

module SiteGuide
  # Calls an OpenAI-compatible chat API. Use Ollama locally for a free model, or OpenAI if you
  # set SITE_GUIDE_OPENAI_API_KEY (paid).
  class LlmResponder
    class Error < StandardError; end

    OPENAI_DEFAULT_URL = "https://api.openai.com/v1/chat/completions"
    OLLAMA_DEFAULT_URL = "http://127.0.0.1:11434/v1/chat/completions"
    DEFAULT_OPENAI_MODEL = "gpt-4o-mini"
    DEFAULT_OLLAMA_MODEL = "llama3.2"
    TIMEOUT_SECONDS = 60

    def self.enabled?
      provider.present?
    end

    def self.provider
      explicit = ENV["SITE_GUIDE_LLM_PROVIDER"].to_s.downcase
      return :ollama if explicit.in?(%w[ollama local])
      return :openai if explicit == "openai"
      return :openai if ENV["SITE_GUIDE_OPENAI_API_KEY"].present?
      return :ollama if ENV["SITE_GUIDE_LLM_BASE_URL"].present?

      nil
    end

    def self.call(message:, pathname: "", course_id: nil, snippets: [])
      new(message:, pathname:, course_id:, snippets:).call
    end

    def initialize(message:, pathname: "", course_id: nil, snippets: [])
      @message = message.to_s
      @pathname = pathname.to_s
      @course_id = course_id
      @snippets = snippets
    end

    def call
      response = post_chat_completion
      content = response.dig("choices", 0, "message", "content")
      raise Error, "empty model response" if content.blank?

      content.strip
    end

    private

    def post_chat_completion
      uri = URI(chat_completions_url)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.scheme == "https"
      http.open_timeout = TIMEOUT_SECONDS
      http.read_timeout = TIMEOUT_SECONDS

      request = Net::HTTP::Post.new(uri)
      request["Content-Type"] = "application/json"
      api_key = api_key_for_provider
      request["Authorization"] = "Bearer #{api_key}" if api_key.present?
      request.body = {
        model: model_name,
        temperature: 0.2,
        stream: false,
        messages: [
          { role: "system", content: system_prompt },
          { role: "user", content: user_prompt }
        ]
      }.to_json

      raw = http.request(request)
      unless raw.is_a?(Net::HTTPSuccess)
        raise Error, "LLM HTTP #{raw.code}: #{raw.body.to_s.truncate(200)}"
      end

      JSON.parse(raw.body)
    rescue JSON::ParserError
      raise Error, "invalid LLM JSON response"
    end

    def chat_completions_url
      base = ENV["SITE_GUIDE_LLM_BASE_URL"].presence
      if base.present?
        base = base.delete_suffix("/")
        return "#{base}/chat/completions" if base.end_with?("/v1")

        return "#{base}/v1/chat/completions"
      end

      self.class.provider == :ollama ? OLLAMA_DEFAULT_URL : OPENAI_DEFAULT_URL
    end

    def model_name
      ENV.fetch("SITE_GUIDE_LLM_MODEL") do
        self.class.provider == :ollama ? DEFAULT_OLLAMA_MODEL : DEFAULT_OPENAI_MODEL
      end
    end

    def api_key_for_provider
      if self.class.provider == :openai
        ENV["SITE_GUIDE_OPENAI_API_KEY"].presence
      else
        # Ollama ignores this; OpenAI-compatible proxies may require a non-empty value.
        ENV.fetch("SITE_GUIDE_LLM_API_KEY", "ollama")
      end
    end

    def system_prompt
      <<~PROMPT.squish
        You are the Canvas site guide for this fork. Answer the user's question using ONLY the
        help articles provided in the user message. If the articles do not contain the answer,
        say you do not know and suggest topics they can ask about (Dashboard, navigation,
        card appearance presets, site guide button). Do not invent features. Be concise and friendly.
        Do not mention other users or private data.
      PROMPT
    end

    def user_prompt
      context_lines = @snippets.map do |article|
        "### #{article.title}\n#{article.body}"
      end

      location = @pathname.presence || "unknown"
      course = @course_id.present? ? "course_id=#{@course_id}" : "no course context"

      <<~PROMPT
        Page: #{location} (#{course})

        Help articles:
        #{context_lines.join("\n\n")}

        User question: #{@message}
      PROMPT
    end
  end
end
