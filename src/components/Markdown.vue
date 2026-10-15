<template>
  <div class="markdown-body" v-html="html"></div>
</template>

<script setup>
import { computed } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const props = defineProps({
  content: { type: String, default: '' },
});

const html = computed(() => DOMPurify.sanitize(marked.parse(props.content || '')));
</script>

<style scoped>
.markdown-body {
  font-size: 14px;
  line-height: 1.8;
  word-break: break-word;
  color: #4a5d4e;
}
.markdown-body :deep(h1) { font-size: 17px; font-weight: 700; margin: 12px 0 8px; }
.markdown-body :deep(h2) { font-size: 15px; font-weight: 700; margin: 12px 0 6px; color: #7a907e; }
.markdown-body :deep(h3) { font-size: 14px; font-weight: 700; margin: 10px 0 4px; }
.markdown-body :deep(p) { margin: 6px 0; }
.markdown-body :deep(ul), .markdown-body :deep(ol) { padding-left: 1.25em; margin: 6px 0; }
.markdown-body :deep(li) { margin: 2px 0; }
.markdown-body :deep(strong) { font-weight: 700; color: #5a6b5e; }
.markdown-body :deep(em) { color: #a2c579; font-style: normal; font-weight: 600; }
.markdown-body :deep(blockquote) { border-left: 3px solid #a2c579; padding-left: 10px; margin: 8px 0; color: #7a907e; }
.markdown-body :deep(hr) { border: none; border-top: 1px dashed #dde7dd; margin: 12px 0; }
.markdown-body :deep(code) { background: #f1f6f2; padding: 1px 5px; border-radius: 4px; font-size: 13px; }
</style>
