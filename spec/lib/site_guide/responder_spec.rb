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

describe SiteGuide::Responder do
  before do
    SiteGuide::KnowledgeBase.reload!
  end

  it "returns a dashboard article for dashboard questions" do
    result = described_class.call(message: "How do I use the dashboard?", pathname: "/")
    expect(result.sources).to include("Dashboard overview")
    expect(result.reply).to include("Dashboard")
  end

  it "returns card preset help for appearance questions" do
    result = described_class.call(message: "How do I change card appearance preset?", pathname: "/")
    expect(result.sources).to include("Dashboard card appearance presets")
    expect(result.reply).to include("classic")
  end

  it "returns fallback when no article matches" do
    result = described_class.call(message: "xyzzy quantum flux capacitor", pathname: "/courses/1")
    expect(result.sources).to be_empty
    expect(result.reply).to include("do not have specific help")
  end

  it "does not match unrelated words like meow" do
    result = described_class.call(message: "meow", pathname: "/")
    expect(result.sources).to be_empty
    expect(result.reply).to include("do not have specific help")
  end

  it "prefers dashboard overview over card presets for general dashboard questions" do
    result = described_class.call(message: "how do i use the dashboard", pathname: "/")
    expect(result.sources).to include("Dashboard overview")
  end
end
