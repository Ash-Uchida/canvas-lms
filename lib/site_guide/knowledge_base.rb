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
  class KnowledgeBase
    CORPUS_ROOT = Rails.root.join("doc/site_guide")

    class << self
      def articles
        @articles ||= load_articles
      end

      def reload!
        @articles = nil
        articles
      end

      private

      def load_articles
        return [] unless CORPUS_ROOT.directory?

        Dir.glob(CORPUS_ROOT.join("*.md")).filter_map do |path|
          parse_file(path)
        end
      end

      def parse_file(path)
        raw = File.read(path)
        frontmatter, body = split_frontmatter(raw)
        meta = parse_frontmatter(frontmatter)
        id = File.basename(path, ".md")

        Article.new(
          id:,
          title: meta.fetch("title", id.humanize),
          keywords: parse_list(meta["keywords"]),
          paths: parse_list(meta["paths"]),
          body: body.strip
        )
      rescue StandardError => e
        Rails.logger.warn("[SiteGuide] Skipping #{path}: #{e.message}")
        nil
      end

      def split_frontmatter(raw)
        if raw.start_with?("---\n")
          _, frontmatter, body = raw.split("---\n", 3)
          [frontmatter.to_s, body.to_s]
        else
          ["", raw]
        end
      end

      def parse_frontmatter(frontmatter)
        frontmatter.each_line.with_object({}) do |line, hash|
          key, value = line.split(":", 2)
          next if key.blank? || value.nil?

          hash[key.strip] = value.strip
        end
      end

      def parse_list(value)
        return [] if value.blank?

        value.split(",").map { |item| item.strip.downcase }.reject(&:blank?)
      end
    end
  end
end
