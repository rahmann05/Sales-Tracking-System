export const modernOutletSubChannels=['HYPERMARKET','DRUGSTORE','NAT_SUPERMARKET','LOKAL_SUPERMARKET','CHAIN_MINIMARKET','LOKAL_MINIMARKET','PERKULAKAN'];
export function matchesOutletChannel(channel,subChannel) {
 return !subChannel || (channel==='MODERN_TRADE')===modernOutletSubChannels.includes(subChannel);
}
