const { WebClient } = require("@slack/web-api");
const client = new WebClient(process.env.SLACK_BOT_TOKEN);
const { deliveryTypeToGerman } = require("./mappings");

/* TEXT CREATION HELPERS */

const wrapTextSection = (text, isLast = false) => {
  return `${text}${isLast ? "" : "\n\n"}`;
};

const createHeading = ({ orderName }) => {
  return `*NEUE BESTELLUNG (${orderName})*`;
};

const createDeliveryText = ({ deliveryMethod }) => {
  let deliveryType = deliveryMethod.type;
  deliveryType = deliveryTypeToGerman.hasOwnProperty(deliveryType)
    ? deliveryTypeToGerman[deliveryType]
    : deliveryType;

  let text = "*Liefermethode*\n";
  text += `*Name:* ${deliveryMethod.name}\n`;
  text += `*Typ:* ${deliveryType}`;
  return text;
};

const createCustomerText = ({ customerInfo }) => {
  let text = "*Kunde*\n";
  text += `*Vorname:* ${customerInfo.firstName}\n`;
  text += `*Nachname:* ${customerInfo.lastName}\n`;
  text += `*Adresse:* ${customerInfo.address}\n`;
  if (customerInfo.email) {
    text += `*Email:* ${customerInfo.email}${customerInfo.phone ? "\n" : ""}`;
  }
  if (customerInfo.phone) {
    text += `*Telefonnummer:* ${customerInfo.phone}`;
  }
  return text;
};

const createItemText = ({ itemInfo }) => {
  let text = "";
  const itemCount = itemInfo.length;
  if (!itemCount) {
    return text;
  }
  text += "*Items*\n";
  itemInfo.forEach(({ name, sku, quantity }, i) => {
    text += `${name} (sku: ${sku}): ${quantity}${
      i < itemCount - 1 ? "\n" : ""
    }`;
  });
  return text;
};

/* INTERACT WITH SLACK WEBCLIENT */

const postTextInSlackChannel = async ({
  text,
  slackChannel: slackChannelName,
}) => {
  // find relevant information about the bot
  const botInfo = await client.auth.test();

  // look up the requested slack channel by name
  const channelList = (
    await client.conversations.list({
      exclude_archived: false,
    })
  ).channels;

  let slackChannel = channelList.find(({ name }) => slackChannelName === name);

  // create new slack channel if no channel with requested name exists
  if (!slackChannel) {
    slackChannel = (
      await client.conversations.create({
        name: slackChannelName,
        is_private: false,
        team_id: botInfo.team_id,
      })
    ).channel;
  }

  // join the channel if bot is not in it yet
  // TODO: pagination limit is 100, keep this in mind
  const channelMembers = (
    await client.conversations.members({
      channel: slackChannel.id,
    })
  ).members;

  if (!channelMembers.includes(botInfo.user_id)) {
    await client.conversations.join({
      channel: slackChannel.id,
    });
  }

  // post the text message inside the channel
  await client.chat.postMessage({
    channel: slackChannelName,
    text,
  });
};

/* CREATE AND SEND SLACK MESSAGE BASED ON FULFILLMENT INFO */

exports.sendSlackNotification = async ({
  orderName,
  deliveryMethod,
  customerInfo,
  itemInfo,
  slackChannel,
}) => {
  let text = "";
  text += wrapTextSection(createHeading({ orderName }));
  text += wrapTextSection(createDeliveryText({ deliveryMethod }));
  text += wrapTextSection(createCustomerText({ customerInfo }));
  text += wrapTextSection(createItemText({ itemInfo }), true);

  await postTextInSlackChannel({ text, slackChannel });
};
