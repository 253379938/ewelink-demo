import type { SwitchItem } from "@/views/home/types";

export const getSwitchStatus = (switches: SwitchItem[]) => {
  const total = switches.length;
  const onCount = switches.filter((item) => item.switch === "on").length;
  const offCount = total - onCount;

  let text = "";
  if (onCount === total) {
    text = "全开";
  } else if (offCount === total) {
    text = "全关";
  } else {
    text = `${onCount}开${offCount}关`;
  }

  return {
    total,
    onCount,
    offCount,
    text,
    isAllOn: onCount === total,
    isAllOff: offCount === total
  };
};
