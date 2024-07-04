<template>
  <div id="app">
    <Logos />
    <!-- <HelloWorld /> -->
  </div>
</template>

<script>
import Logos from "./components/Logos.vue";
// import HelloWorld from "./components/HelloWorld.vue";

export default {
  name: "App",
  components: {
    Logos,
    // HelloWorld
  },
};
</script>

<style lang="scss">
@import "~@/assets/scss/vendors/bootstrap-vue/index";
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: white;
  font-size: larger;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 90vh;
  padding: 100px;
  flex-direction: column-reverse;
  background-color: #4a4a48;
}
</style>
