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

describe SiteGuideController do
  context "when user is not logged in" do
    it "returns unauthorized" do
      post "chat", params: { message: "hello" }, format: :json
      assert_status(401)
    end
  end

  context "when user is logged in" do
    let(:user) { user_factory }

    before do
      user_session(user)
      allow(Rails.cache).to receive(:read).and_return(0)
      allow(Rails.cache).to receive(:write)
    end

    it "returns a grounded reply" do
      post "chat",
           params: { message: "How do I use the dashboard?", pathname: "/" },
           as: :json

      expect(response).to be_successful
      json = json_parse
      expect(json["reply"]).to be_present
      expect(json["sources"]).to be_a(Array)
    end

    it "rejects blank messages" do
      post "chat", params: { message: "   " }, as: :json
      assert_status(400)
    end
  end
end
