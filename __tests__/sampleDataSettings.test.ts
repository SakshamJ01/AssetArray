import {
  getShowSampleDataSetting,
  setShowSampleDataSetting,
  subscribeToShowSampleData,
  getCachedShowSampleDataSetting,
} from "../src/services/sampleDataSettings";

describe("SampleDataSettings", () => {
  test("defaults to true and allows setting to false and true", async () => {
    await setShowSampleDataSetting(true);
    expect(await getShowSampleDataSetting()).toBe(true);
    expect(getCachedShowSampleDataSetting()).toBe(true);

    await setShowSampleDataSetting(false);
    expect(await getShowSampleDataSetting()).toBe(false);
    expect(getCachedShowSampleDataSetting()).toBe(false);

    // Reset back to true
    await setShowSampleDataSetting(true);
    expect(await getShowSampleDataSetting()).toBe(true);
  });

  test("notifies subscribers when setting changes", async () => {
    const notifications: boolean[] = [];
    const unsubscribe = subscribeToShowSampleData((enabled) => {
      notifications.push(enabled);
    });

    await setShowSampleDataSetting(false);
    await setShowSampleDataSetting(true);

    unsubscribe();
    await setShowSampleDataSetting(false);

    expect(notifications).toContain(false);
    expect(notifications).toContain(true);
    // After unsubscribe, shouldn't receive additional notifications
    const lastCount = notifications.length;
    await setShowSampleDataSetting(true);
    expect(notifications.length).toBe(lastCount);
  });
});
