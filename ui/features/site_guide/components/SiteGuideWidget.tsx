/*
 * Copyright (C) 2026 - present Instructure, Inc.
 *
 * This file is part of Canvas.
 *
 * Canvas is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, version 3 of the License.
 *
 * Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License along
 * with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {useCallback, useEffect, useRef, useState} from 'react'
import {useScope as createI18nScope} from '@canvas/i18n'
import doFetchApi from '@canvas/do-fetch-api-effect'
import {Button, CloseButton, IconButton} from '@instructure/ui-buttons'
import {Flex} from '@instructure/ui-flex'
import {Heading} from '@instructure/ui-heading'
import {IconQuestionLine} from '@instructure/ui-icons'
import {Spinner} from '@instructure/ui-spinner'
import {Text} from '@instructure/ui-text'
import {TextArea} from '@instructure/ui-text-area'
import {View} from '@instructure/ui-view'

const I18n = createI18nScope('site_guide')

export type GuideMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
}

type ChatApiResponse = {
  reply: string
  sources?: string[]
}

const WIDGET_Z_INDEX = 10000
const PANEL_BOTTOM_OFFSET = '1.25rem'
const PANEL_INLINE_END_OFFSET = '1.25rem'

function buildWelcomeMessage(): GuideMessage {
  return {
    id: 'welcome',
    role: 'assistant',
    text: I18n.t(
      'Hi! I am your Canvas site guide. Ask how to use this page, the Dashboard, navigation, or dashboard card appearance presets.',
    ),
  }
}

function pageContextLabel(): string {
  const path = window.location.pathname
  const courseMatch = path.match(/\/courses\/(\d+)/)
  if (courseMatch) {
    return I18n.t('Course page (course id %{id})', {id: courseMatch[1]})
  }
  if (path.includes('/dashboard')) {
    return I18n.t('Dashboard')
  }
  return path || I18n.t('Current page')
}

function chatRequestBody(message: string): Record<string, unknown> {
  const courseId = typeof ENV !== 'undefined' && ENV.COURSE_ID != null ? ENV.COURSE_ID : null
  return {
    message,
    pathname: window.location.pathname,
    course_id: courseId,
  }
}

function formatAssistantReply(reply: string, sources?: string[]): string {
  if (!sources?.length) return reply
  return `${reply}\n\n${I18n.t('Source: %{sources}', {sources: sources.join(', ')})}`
}

async function fetchGuideReply(message: string): Promise<ChatApiResponse> {
  const {json, response} = await doFetchApi<ChatApiResponse>({
    path: '/api/v1/users/self/site_guide/chat',
    method: 'POST',
    body: chatRequestBody(message),
  })

  if (!response.ok) {
    throw new Error(`site_guide_chat_${response.status}`)
  }

  return json ?? {reply: I18n.t('Something went wrong. Please try again.')}
}

export default function SiteGuideWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<GuideMessage[]>(() => [buildWelcomeMessage()])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => {
      textareaRef.current?.focus()
      messagesEndRef.current?.scrollIntoView({behavior: 'smooth'})
    })
  }, [open, messages])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  const handleSend = useCallback(async () => {
    const trimmed = draft.trim()
    if (!trimmed || sending) return

    const userMessage: GuideMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
    }

    setMessages(prev => [...prev, userMessage])
    setDraft('')
    setSending(true)

    try {
      const {reply, sources} = await fetchGuideReply(trimmed)
      const assistantMessage: GuideMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: formatAssistantReply(reply, sources),
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          text: I18n.t(
            'Sorry, I could not reach the site guide right now. Please try again in a moment.',
          ),
        },
      ])
    } finally {
      setSending(false)
    }
  }, [draft, sending])

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void handleSend()
    }
  }

  const launcher = (
    <View
      as="div"
      position="fixed"
      insetBlockEnd={PANEL_BOTTOM_OFFSET}
      insetInlineEnd={PANEL_INLINE_END_OFFSET}
      zIndex={WIDGET_Z_INDEX}
    >
      <IconButton
        screenReaderLabel={I18n.t('Open site guide')}
        color="primary"
        shape="circle"
        size="large"
        onClick={() => setOpen(true)}
        renderIcon={IconQuestionLine}
        withBackground={true}
        withShadow={true}
      />
    </View>
  )

  const panel = (
    <View
      as="div"
      role="dialog"
      aria-label={I18n.t('Site guide')}
      position="fixed"
      insetBlockEnd={PANEL_BOTTOM_OFFSET}
      insetInlineEnd={PANEL_INLINE_END_OFFSET}
      zIndex={WIDGET_Z_INDEX}
      width="22rem"
      maxWidth="calc(100vw - 2rem)"
      height="28rem"
      maxHeight="calc(100vh - 6rem)"
      background="primary"
      borderWidth="small"
      borderColor="primary"
      borderRadius="large"
      shadow="above"
      stacking="topmost"
      overflow="hidden"
    >
      <div
        style={{
          display: 'grid',
          gridTemplateRows: 'auto minmax(0, 1fr) auto',
          height: '100%',
          minHeight: 0,
        }}
      >
        <View as="div" padding="small" borderWidth="0 0 small 0" borderColor="primary">
          <Flex alignItems="center" justifyItems="space-between">
            <Flex.Item shouldGrow shouldShrink>
              <Heading level="h3" margin="none">
                {I18n.t('Site guide')}
              </Heading>
              <Text size="small" color="secondary">
                {pageContextLabel()}
              </Text>
            </Flex.Item>
            <CloseButton
              placement="end"
              offset="small"
              screenReaderLabel={I18n.t('Close site guide')}
              onClick={() => setOpen(false)}
            />
          </Flex>
        </View>

        <View as="div" padding="small" overflowY="auto" overflowX="hidden">
          {messages.map(message => (
            <View
              key={message.id}
              as="div"
              margin="0 0 small 0"
              padding="x-small small"
              background={message.role === 'user' ? 'secondary' : 'primary'}
              borderRadius="medium"
            >
              <Text size="small" weight={message.role === 'user' ? 'bold' : 'normal'}>
                {message.role === 'user' ? I18n.t('You') : I18n.t('Guide')}
              </Text>
              <Text as="p" size="small" margin="xx-small 0 0 0" whiteSpace="pre-wrap">
                {message.text}
              </Text>
            </View>
          ))}
          {sending && (
            <Flex margin="small 0 0 0" alignItems="center">
              <Spinner renderTitle={I18n.t('Loading')} size="x-small" />
              <Text size="small" margin="0 0 0 x-small">
                {I18n.t('Thinking...')}
              </Text>
            </Flex>
          )}
          <div ref={messagesEndRef} />
        </View>

        <View
          as="div"
          padding="small"
          borderWidth="small 0 0 0"
          borderColor="primary"
          background="primary"
        >
          <TextArea
            label={I18n.t('Ask a question')}
            placeholder={I18n.t('How do I...?')}
            value={draft}
            disabled={sending}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            textareaRef={el => {
              textareaRef.current = el
            }}
          />
          <View as="div" margin="small 0 0 0">
            <Button
              color="primary"
              onClick={() => void handleSend()}
              disabled={!draft.trim() || sending}
            >
              {I18n.t('Send')}
            </Button>
          </View>
        </View>
      </div>
    </View>
  )

  return <>{open ? panel : launcher}</>
}
