'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, IconButton, Paper, Stack, Tooltip } from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import DOMPurify from 'dompurify';

const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'ul', 'ol', 'li'];
const ALLOWED_ATTR = {};

function sanitizeHtml(html) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
}

function saveSelection(container) {
  const selection = window.getSelection?.();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  const preRange = range.cloneRange();
  preRange.selectNodeContents(container);
  preRange.setEnd(range.startContainer, range.startOffset);
  const start = preRange.toString().length;
  preRange.setEnd(range.endContainer, range.endOffset);
  const end = preRange.toString().length;
  return { start, end };
}

function restoreSelection(container, saved) {
  const selection = window.getSelection?.();
  if (!selection || !container) return;
  selection.removeAllRanges();

  const range = document.createRange();
  range.setStart(container, 0);
  range.collapse(true);

  if (!saved) {
    range.selectNodeContents(container);
    range.collapse(false);
    selection.addRange(range);
    return;
  }

  let charIndex = 0;
  let foundStart = false;
  const nodeStack = [container];

  while (nodeStack.length > 0) {
    const node = nodeStack.pop();
    if (node.nodeType === Node.TEXT_NODE) {
      const textLength = node.textContent.length;
      const nextCharIndex = charIndex + textLength;

      if (!foundStart && saved.start >= charIndex && saved.start <= nextCharIndex) {
        range.setStart(node, saved.start - charIndex);
        foundStart = true;
      }

      if (foundStart && saved.end >= charIndex && saved.end <= nextCharIndex) {
        range.setEnd(node, saved.end - charIndex);
        selection.addRange(range);
        return;
      }

      charIndex = nextCharIndex;
    } else {
      for (let i = node.childNodes.length - 1; i >= 0; i -= 1) {
        nodeStack.push(node.childNodes[i]);
      }
    }
  }

  range.selectNodeContents(container);
  range.collapse(false);
  selection.addRange(range);
}

function exec(command) {
  if (typeof document === 'undefined') return;
  document.execCommand(command, false, null);
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  disabled = false,
  minHeight = 120,
}) {
  const editorRef = useRef(null);
  const selectionRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  const setContent = useCallback((html) => {
    if (!editorRef.current) return;
    const sanitized = sanitizeHtml(html || '');
    if (editorRef.current.innerHTML !== sanitized) {
      editorRef.current.innerHTML = sanitized;
    }
  }, []);

  useEffect(() => {
    if (!isFocused) {
      setContent(value || '');
    }
  }, [value, isFocused, setContent]);

  const emitChange = useCallback(() => {
    if (!editorRef.current) return;
    const sanitized = sanitizeHtml(editorRef.current.innerHTML);
    editorRef.current.innerHTML = sanitized;
    onChange?.(sanitized);
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    const saved = saveSelection(editorRef.current);
    selectionRef.current = saved;
    emitChange();
    requestAnimationFrame(() => {
      restoreSelection(editorRef.current, saved);
    });
  }, [emitChange]);

  const handleCommand = useCallback(
    (command) => {
      if (disabled || !editorRef.current) return;
      restoreSelection(editorRef.current, selectionRef.current);
      exec(command);
      handleInput();
    },
    [disabled, handleInput],
  );

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 1,
        borderColor: 'divider',
        overflow: 'hidden',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <Stack
        direction="row"
        spacing={0.5}
        alignItems="center"
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          px: 1,
          py: 0.5,
        }}
      >
        <Tooltip title="Bold">
          <span>
            <IconButton size="small" onClick={() => handleCommand('bold')} disabled={disabled}>
              <FormatBoldIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Italic">
          <span>
            <IconButton size="small" onClick={() => handleCommand('italic')} disabled={disabled}>
              <FormatItalicIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Underline">
          <span>
            <IconButton size="small" onClick={() => handleCommand('underline')} disabled={disabled}>
              <FormatUnderlinedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Bulleted list">
          <span>
            <IconButton
              size="small"
              onClick={() => handleCommand('insertUnorderedList')}
              disabled={disabled}
            >
              <FormatListBulletedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
      <Box
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={handleInput}
        onFocus={() => {
          setIsFocused(true);
          restoreSelection(editorRef.current, selectionRef.current);
        }}
        onBlur={() => {
          selectionRef.current = saveSelection(editorRef.current);
          setIsFocused(false);
          emitChange();
        }}
        data-placeholder={placeholder || ''}
        spellCheck
        sx={{
          minHeight,
          px: 1.5,
          py: 1,
          fontSize: '0.95rem',
          lineHeight: 1.6,
          textAlign: 'left',
          outline: 'none',
          '&:empty:before': {
            content: 'attr(data-placeholder)',
            color: 'text.disabled',
          },
          '& ul, & ol': {
            pl: 2.5,
            mb: 0,
          },
          '& p': {
            mt: 0,
            mb: 1.2,
          },
          '& p:last-child': {
            mb: 0,
          },
        }}
      />
    </Paper>
  );
}

