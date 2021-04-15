const { fillDynamicText, isNowWithinTimeInterval } = require("./helpers");

/* HELPERS TO FILL DYNAMIC TEXT */

const createDayText = (latestOrderTime) => {
  const hasLatestOrderTimePassed = !isNowWithinTimeInterval({
    endTime: latestOrderTime,
  });
  return hasLatestOrderTimePassed ? "morgen" : "heute";
};

/* DETERMINE ALL AVAILABLE VENDOR RATES FOR AN ORDER */

exports.determineVendorRates = async ({
  checkoutOptions,
  localWarehouseName,
}) => {
  // determine available rates based on vendor checkout option time slots
  let rates = [];

  checkoutOptions.forEach(
    ({
      type,
      serviceName: serviceNameWithVariables,
      descriptionWithVariables,
      latestOrderTime,
      deliveryWindowEarliest,
      deliveryWindowLatest,
      totalPrice,
    }) => {
      // replace variables in service name text
      const replacementDictServiceName = {
        local_warehouse_name: localWarehouseName,
      };
      const serviceName = fillDynamicText(
        serviceNameWithVariables,
        replacementDictServiceName
      );

      // replace variables in description text
      const dayText = createDayText(latestOrderTime);
      const replacementDictDescription = {
        day_text: dayText,
        delivery_window_earliest: deliveryWindowEarliest,
        delivery_window_latest: deliveryWindowLatest,
        local_warehouse_name: localWarehouseName,
        latest_order_time_for_same_day_processing: latestOrderTime,
      };
      const description = fillDynamicText(
        descriptionWithVariables,
        replacementDictDescription
      );

      rates.push({
        service_name: serviceName,
        service_code: type,
        description,
        total_price: totalPrice,
        currency: "EUR",
      });
    }
  );

  return rates;
};
