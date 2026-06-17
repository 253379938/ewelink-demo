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
    console.log(switches);
    const status = getSwitchStatus(switches);
    return status.text;
});

const handleThing = () => {
};

</script>

<template>
    <div class="p-4 border rounded shadow-sm bg-white w-[200px]" @click="handleThing">
        <div class="font-bold">{{ thing.itemData.name }}</div>
        <div class="text-xs mt-2" :class="thing.itemData.online ? 'text-green-500' : 'text-red-500'">
            {{ thing.itemData.online ? "在线" : "离线" }}
        </div>
        <div class="text-xs mt-2">{{ switchStatusText }}</div>
    </div>
</template>

<style scoped lang="scss"></style>
