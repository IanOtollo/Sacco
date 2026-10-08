// Text the members search index matches against. Includes the phone in both
// canonical (+2547…) and local (07…) forms so either way of typing it works.
export function memberSearchText(m: {
  firstName: string;
  lastName: string;
  middleName?: string;
  memberNumber: string;
  phoneNumber: string;
  nationalId: string;
}): string {
  const localPhone = m.phoneNumber.startsWith("+254")
    ? `0${m.phoneNumber.slice(4)}`
    : m.phoneNumber;
  return [
    m.firstName,
    m.lastName,
    m.middleName,
    m.memberNumber,
    m.phoneNumber,
    localPhone,
    m.nationalId,
  ]
    .filter(Boolean)
    .join(" ");
}
