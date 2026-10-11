export function deliveryGpsUnavailable(route) {
  return Boolean(route.departedAt && !route.returnedAt && !route.closedAt && !route.cancelledAt && route.locationPolicy?.enabled !== false && !route.location?.isLive);
}
