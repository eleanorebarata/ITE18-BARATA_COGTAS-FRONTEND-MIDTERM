<script setup lang="ts">
defineProps<{ busy: boolean; error: string }>()
const emit = defineEmits<{ submit: [payload: { rating: number; tags: string[]; comment: string }] }>()

const rating = ref(0)
const tags = ref<string[]>([])
const comment = ref('')
const localError = ref('')

function send() {
  localError.value = ''
  if (!rating.value) {
    localError.value = 'Choose a star rating.'
    return
  }
  emit('submit', { rating: rating.value, tags: tags.value, comment: comment.value.trim() })
}
</script>

<template>
  <form novalidate @submit.prevent="send">
    <p v-if="error || localError" role="alert" style="background: #f8e6e6; color: #8a1c1c; padding: 12px; border-radius: 8px">
      {{ error || localError }}
    </p>

    <fieldset>
      <legend>Your rating</legend>
      <label v-for="n in 5" :key="n" style="margin-right: 12px; display: inline-block; min-height: 44px">
        <input v-model.number="rating" type="radio" name="rating" :value="n" /> {{ n }} &#9733;
      </label>
    </fieldset>

    <fieldset style="margin-top: 12px">
      <legend>What went well? (optional)</legend>
      <label v-for="t in reviewTags" :key="t" style="margin-right: 12px; display: inline-block; min-height: 44px">
        <input v-model="tags" type="checkbox" :value="t" /> {{ t }}
      </label>
    </fieldset>

    <label for="fb-comment" style="display: block; margin-top: 12px">Comment (optional, at most {{ MAX_COMMENT }} characters)</label>
    <textarea id="fb-comment" v-model="comment" :maxlength="MAX_COMMENT" rows="3" style="display: block; width: 100%" />
    <small>Your first name and comment will be visible to other passengers.</small>

    <div>
      <button type="submit" :disabled="busy"
              style="margin-top: 16px; min-height: 44px; padding: 0 24px; background: #1b6b3a; color: #fff; border: 0; border-radius: 8px">
        {{ busy ? 'Sending...' : 'Send feedback' }}
      </button>
    </div>
  </form>
</template>