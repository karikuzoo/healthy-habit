/**
 * Shadow kartu. Tailwind box-shadow tidak memetakan bersih ke RN
 * (iOS pakai shadow*, Android pakai elevation), jadi didefinisikan sekali di sini
 * dan dipakai lewat komponen <Card />.
 */
export const cardShadow = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 8,
  elevation: 2,
};

export const tabBarShadow = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 0.05,
  shadowRadius: 8,
  elevation: 8,
};

export default cardShadow;
