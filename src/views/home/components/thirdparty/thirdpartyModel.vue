<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { getOpenApiAt, thirdpartyDevice } from '@/api/open-api/thirdparty';
import type { ThingListItem } from '../../types';

const props = defineProps<{
    thing: ThingListItem | null;
}>();
const emit = defineEmits<{ (e: "get-map"): void }>();

const modelValue = defineModel<boolean>();
const iHostForm = reactive<{ iHostUrl: string; }>({
    iHostUrl: '',
});

const iHostUrl = ref(localStorage.getItem('iHost') || '');
const hasIHost = computed(() => iHostUrl.value && iHostUrl.value !== '');

const handleConfirm = async () => {        
    try {
        if (!hasIHost.value) {
            // phoneNumber 作为 app_name
            const app_name = JSON.parse(localStorage.getItem('user') as string).user.phoneNumber || ''
            await getOpenApiAt(iHostForm.iHostUrl, app_name);

            localStorage.setItem('iHost', iHostForm.iHostUrl);
            iHostUrl.value = iHostForm.iHostUrl;
        }
        await thirdpartyDevice(props.thing?.itemData!);
    } catch {
    } finally {
        emit('get-map');
        modelValue.value = false;
    }
};

</script>

<template>
    <el-dialog v-model="modelValue" :title="hasIHost ? '是否确认同步该设备' : '请先获取 iHost 凭证'" width="420" align-center>
        <el-form v-if="!hasIHost" :model="iHostForm" label-width="auto" style="max-width: 600px">
            <el-form-item label="iHost 访问地址">
                <el-input v-model="iHostForm.iHostUrl" />
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="modelValue = false">取消</el-button>
            <el-button type="primary" @click="handleConfirm">确定</el-button>
        </template>
    </el-dialog>
</template>

<style scoped lang="scss"></style>
