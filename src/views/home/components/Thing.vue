<script setup lang="ts">
import { computed } from 'vue';
import type { ThingListItem } from '../types';
import { getSwitchStatus } from '@/utils/getSwitchStatus';

const props = defineProps<{
    thing: ThingListItem;
}>();

const switchStatusText = computed(() => {
    const switches = props.thing.itemData?.params?.switches;
    if (!switches) {
        return '';
    }
    const status = getSwitchStatus(switches);
    return status.text;
});

</script>

<template>
    <div class="p-4 border rounded bg-white w-[200px] h-[120px] cursor-pointer">
        <div class="font-bold">{{ thing.itemData.name }}</div>
        <div class="text-xs mt-[12px]" :class="thing.itemData.online ? 'text-green-500' : 'text-red-500'">
            {{ thing.itemData.online ? "在线" : "离线" }}
        </div>
        <div class="text-xs mt-[12px]" v-if="thing.itemData.online">{{ switchStatusText }}</div>
    </div>
</template>

<style scoped lang="scss"></style>
