<script setup lang="ts">
import type { ThingListItem } from '@/views/home/types';


const modelValue = defineModel<boolean>();
const props = defineProps<{
    thing: ThingListItem | null;
}>();
</script>

<template>
  <el-dialog v-model="modelValue" :title="thing?.itemData.name" width="420" align-center>
        <div class="text-center">
            设备暂未支持
        </div>
    </el-dialog>
</template>

<style scoped lang="scss">
</style>
