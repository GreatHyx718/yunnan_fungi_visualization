// Species named in the China CDC poisoning reports (data/cdc/species_matches.csv).
export const CDC_SPECIES = [
  "Agaricus campestris", "Amanita fritillaria", "Amanita ochracea", "Amanita princeps",
  "Amanita pseudoporphyria", "Amanita rubroflava", "Amanita sinensis", "Amanita subfrostiana",
  "Amanita subglobosa", "Amanita virgineoides", "Baorangia major", "Baorangia pseudocalopus",
  "Boletellus emodensis", "Boletellus indistinctus", "Butyriboletus roseoflavus",
  "Coprinellus micaceus", "Coprinus comatus", "Gymnopilus dilepis", "Gymnopus dryophilus",
  "Hypholoma fasciculare", "Lactifluus tenuicystidiatus", "Lanmaoa asiatica", "Lentinula edodes",
  "Leucocoprinus cretaceus", "Neoboletus flavidus", "Phylloporus brunneiceps", "Retiboletus fuscus",
  "Rubroboletus sinicus", "Russula sanguinea", "Suillus granulatus", "Suillus pinetorum",
  "Suillus placidus", "Thelephora ganbajun", "Trametes hirsuta",
];

// "Poisonous" = named in a CDC report, or flagged poisonous in the edible-species literature
// (same rule as the Poisonous Mushrooms page: Poisonous + Edible-Poisonous).
export function poisonousSpeciesSet(records) {
  const set = new Set(CDC_SPECIES);
  for (const r of records) if (r.sp && r.ed === 2) set.add(r.sp);
  return set;
}
