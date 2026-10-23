import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

for (const gesture of ['gesturestart', 'gesturechange']) {
  document.addEventListener(gesture, (event) => event.preventDefault(), { passive: false })
}

createApp(App).mount('#app')
