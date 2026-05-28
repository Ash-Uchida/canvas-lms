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

module SiteGuide
  class Responder
    Result = Data.define(:reply, :sources)

    MIN_KEYWORD_SCORE = 2

    FALLBACK_REPLY = <<~TEXT.squish
      I do not have specific help for that question yet. Try asking about the Dashboard,
      navigation, the site guide button, or dashboard card appearance presets.
    TEXT

    # Extra weight when the user message clearly targets a topic.
    INTENT_ARTICLE_IDS = [
      [/preset|appearance|bubble|classic|star|cat|style|theme/i, "card-appearance-presets"],
      [/navigat|sidebar|global menu|account menu/i, "navigation"],
      [/site guide|help button|question mark|chat panel/i, "site-guide-widget"],
    ].freeze

    def self.call(message:, pathname: "", course_id: nil)
      new(message:, pathname:, course_id:).call
    end

    def initialize(message:, pathname: "", course_id: nil)
      @message = message.to_s
      @pathname = pathname.to_s
      @course_id = course_id
    end

    def call
      articles = KnowledgeBase.articles
      return fallback_result if articles.empty?

      ranked = rank_articles(articles)
      snippets = ranked.first(3).map(&:first)

      if LlmResponder.enabled?
        return llm_result(snippets) if snippets.any?

        return fallback_result
      end

      if ranked.empty?
        fallback_result
      else
        article, = ranked.first
        Result.new(reply: article.body, sources: [article.title])
      end
    end

    private

    def rank_articles(articles)
      articles
        .map { |article| [article, score(article)] }
        .select { |_, keyword_score| keyword_score >= MIN_KEYWORD_SCORE }
        .sort_by { |_, keyword_score| -keyword_score }
    end

    def llm_result(snippets)
      reply = LlmResponder.call(
        message: @message,
        pathname: @pathname,
        course_id: @course_id,
        snippets:
      )
      Result.new(reply:, sources: snippets.map(&:title))
    rescue LlmResponder::Error => e
      Rails.logger.warn("[SiteGuide] LLM failed: #{e.message}")
      if snippets.any?
        article = snippets.first
        Result.new(reply: article.body, sources: [article.title])
      else
        fallback_result
      end
    end

    def fallback_result
      context_hint = @pathname.present? ? " You are currently on #{@pathname}." : ""
      course_hint = @course_id.present? ? " Course context id: #{@course_id}." : ""
      Result.new(reply: "#{FALLBACK_REPLY}#{context_hint}#{course_hint}", sources: [])
    end

    def score(article)
      tokens = tokenize(@message)
      return 0 if tokens.empty?

      keyword_score = 0

      tokens.each do |token|
        article.keywords.each do |keyword|
          if keyword == token
            keyword_score += 4
          elsif keyword.length >= 4 && (keyword.include?(token) || token.include?(keyword))
            keyword_score += 1
          end
        end

        tokenize(article.title).each do |title_token|
          keyword_score += 2 if title_token == token
        end
      end

      INTENT_ARTICLE_IDS.each do |pattern, article_id|
        keyword_score += 6 if article.id == article_id && @message.match?(pattern)
      end

      # Prefer the dashboard overview when the user asks about the dashboard generally.
      if article.id == "dashboard" && tokens.include?("dashboard") && !@message.match?(/preset|appearance|style/i)
        keyword_score += 3
      end

      return 0 if keyword_score < MIN_KEYWORD_SCORE

      path_boost =
        if article.paths.any? { |path_prefix| @pathname.start_with?(path_prefix) }
          1
        else
          0
        end

      keyword_score + path_boost
    end

    def tokenize(text)
      text.downcase.scan(/[a-z0-9]+/).reject { |token| token.length < 3 }
    end
  end
end
