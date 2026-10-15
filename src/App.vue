<template>
  <div class="flex flex-col h-[100dvh] w-screen watercolor-bg overflow-hidden font-sans text-[#4A5D4E] relative">
    <div class="absolute inset-0 bg-white/40 z-0"></div>
    <div class="relative z-10 flex flex-col h-full w-full overflow-hidden">
      <router-view />
    </div>
  </div>
</template>
