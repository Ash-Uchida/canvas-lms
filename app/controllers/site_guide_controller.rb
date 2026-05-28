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

# @API Site guide
class SiteGuideController < ApplicationController
  MAX_MESSAGE_LENGTH = 2_000
  RATE_LIMIT_PER_MINUTE = 30

  # @API Ask the site guide
  #
  # Returns a grounded reply from the site guide knowledge base.
  #
  # @argument message [Required, String]
  #   The user's question.
  #
  # @argument pathname [Optional, String]
  #   Current browser pathname for context-aware retrieval.
  #
  # @argument course_id [Optional, Integer]
  #   Current course id when available.
  #
  # @example_request
  #   curl 'https://<canvas>/api/v1/users/self/site_guide/chat' \
  #     -X POST \
  #     -H 'Authorization: Bearer <token>' \
  #     -H 'Content-Type: application/json' \
  #     -d '{"message":"How do I use the dashboard?","pathname":"/"}'
  #
  # @returns SiteGuideReply
  def chat
    return rate_limit_response if rate_limited?

    message = params[:message].to_s.strip
    if message.blank?
      return render json: { errors: [{ message: "message is required" }] }, status: :bad_request
    end
    if message.length > MAX_MESSAGE_LENGTH
      return render json: { errors: [{ message: "message is too long" }] }, status: :bad_request
    end

    result = SiteGuide::Responder.call(
      message:,
      pathname: params[:pathname].to_s,
      course_id: params[:course_id].presence
    )

    render json: {
      reply: result.reply,
      sources: result.sources
    }
  end

  private

  def rate_limited?
    key = ["site_guide_rate", @current_user.id].join(":")
    count = Rails.cache.read(key).to_i
    if count >= RATE_LIMIT_PER_MINUTE
      true
    else
      Rails.cache.write(key, count + 1, expires_in: 1.minute)
      false
    end
  end

  def rate_limit_response
    render json: { errors: [{ message: "rate limit exceeded" }] }, status: :too_many_requests
  end
end
