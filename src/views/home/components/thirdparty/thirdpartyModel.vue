<script setup lang="ts">
import { computed, reactive } from 'vue';
import { getOpenApiAt, thirdpartyDevice } from '@/api/open-api/thirdparty';
import type { ThingListItem } from '../../types';

const props = defineProps<{
    thing: ThingListItem | null;
}>();
const emit = defineEmits<{ (e: "get-map"): void }>();

const modelValue = defineModel<boolean>();
const iHostForm = reactive<{ iHostUrl: string; iHostPassword: string; }>({
    iHostUrl: '',
    iHostPassword: '',
});

let iHostAt = localStorage.getItem('iHostToken');
const hasIHost = computed(() => iHostAt && iHostAt !== '')

const handleConfirm = async () => {    
    try {
        if (!hasIHost.value) {
            // phoneNumber 作为 app_name
            const app_name = JSON.parse(localStorage.getItem('user') as string).user.phoneNumber || ''
            const res = await getOpenApiAt(iHostForm.iHostUrl, iHostForm.iHostPassword, app_name);

            localStorage.setItem('iHostToken', res.data.access_token);
            localStorage.setItem('iHost', iHostForm.iHostUrl);
            iHostAt = res.data.access_token;
        }
        await thirdpartyDevice(props.thing?.itemData);
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
            <el-form-item label="iHost IP">
                <el-input v-model="iHostForm.iHostUrl" />
            </el-form-item>
            <el-form-item label="iHost password">
                <el-input v-model="iHostForm.iHostPassword" />
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="modelValue = false">取消</el-button>
            <el-button type="primary" @click="handleConfirm">确定</el-button>
        </template>
    </el-dialog>
</template>

<style scoped lang="scss"></style>
