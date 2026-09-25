import { osmPlaces, type Place, type PlaceKind } from "./maastricht-places";

export type Category = "bar" | "club" | "event" | "food" | "private";

export type Person = {
  id: string;
  name: string;
  initials: string;
  /** Hex color used for avatar circles */
  color: string;
};

export type Venue = {
  id: string;
  name: string;
  category: Category;
  /** Short, two-line address */
  address: string;
  lng: number;
  lat: number;
  /** e.g. "22:00 – late" */
  time: string;
  vibe: string;
  /** 1–3 */
  price: 1 | 2 | 3;
  description: string;
  goingCount: number;
  /** A few people the user knows who are going */
  friendsGoing: Person[];
  /** true if the venue is buzzing tonight (orange marker + rings) */
  busy?: boolean;
  isPrivate?: boolean;
  hostId?: string;
  /** Public nights anyone in Maastricht can join. */
  openJoin?: boolean;
  /** Friend account ids invited to a private (or public) night. */
  invitedIds?: string[];
};

export type Invitation = {
  id: string;
  venueId: string;
  from: Person;
  message: string;
  /** SAMPLE: short headline on the invitation, e.g. "Rooftop tonight. You’re on the list." */
  headline?: string;
  /** SAMPLE: what to bring, if the host asked for something. */
  bring?: string;
  /** SAMPLE: the rough area shown before you join; the exact spot stays hidden. */
  areaHint?: string;
};

export const people: Record<string, Person> = {
  leo: { id: "leo", name: "Leo", initials: "L", color: "#6f56ff" },
  thies: { id: "thies", name: "Thies", initials: "T", color: "#ff7a1a" },
  mara: { id: "mara", name: "Mara", initials: "M", color: "#1c1c1e" },
  jonas: { id: "jonas", name: "Jonas", initials: "J", color: "#3a7d44" },
  sofie: { id: "sofie", name: "Sofie", initials: "S", color: "#c2410c" },
  noor: { id: "noor", name: "Noor", initials: "N", color: "#0f766e" },
  finn: { id: "finn", name: "Finn", initials: "F", color: "#7c2d12" },
};

export const currentUser: Person = {
  id: "me",
  name: "Henrik",
  initials: "H",
  color: "#9ed10e",
};

/** Accounts the current user can invite (Phase 1 sample). */
export const friends: Person[] = Object.values(people);

export type { Place, PlaceKind };

export const venues: Venue[] = [
  {
    id: "complex",
    name: "Complex",
    category: "club",
    address: "Griend 7 · Sint Maartenspoort",
    lng: 5.697665,
    lat: 50.852257,
    time: "23:00 – 05:00",
    vibe: "Techno · basement · loud",
    price: 2,
    description:
      "Maastricht’s underground club on the Griend. Tonight: local residents, dark room, no phones on the floor.",
    goingCount: 148,
    friendsGoing: [people.thies, people.mara, people.jonas],
    busy: true,
  },
  {
    id: "take-five",
    name: "Take Five",
    category: "bar",
    address: "Bredestraat 14 · Binnenstad",
    lng: 5.690264,
    lat: 50.848167,
    time: "20:00 – 02:00",
    vibe: "Cocktails · live jazz trio",
    price: 2,
    description:
      "Long bar, warm light, a piano in the corner. The trio starts at 21:30 and the Negronis are the move.",
    goingCount: 63,
    friendsGoing: [people.sofie, people.noor],
    busy: true,
  },
  {
    id: "de-poshoorn",
    name: "Café De Poshoorn",
    category: "bar",
    address: "Stationsstraat 47 · Wyck",
    lng: 5.701227,
    lat: 50.849387,
    time: "17:00 – 01:00",
    vibe: "Brown café · Belgian beers",
    price: 1,
    description:
      "Wood, brass and 60 beers on the list. The terrace is the meeting point before crossing the bridge.",
    goingCount: 27,
    friendsGoing: [people.finn],
  },
  {
    id: "de-alla",
    name: "De Alla",
    category: "club",
    address: "Brusselsestraat 1 · Binnenstad",
    lng: 5.68559,
    lat: 50.849575,
    time: "22:00 – 04:00",
    vibe: "Student night · cheap drinks",
    price: 1,
    description:
      "The Tuesday-that-is-actually-any-day student club. Playlist somewhere between 2010 and now.",
    goingCount: 94,
    friendsGoing: [people.jonas, people.finn],
    busy: true,
  },
  {
    id: "vrijthof-sessions",
    name: "Vrijthof Sunset Sessions",
    category: "event",
    address: "Vrijthof · Binnenstad",
    lng: 5.68863,
    lat: 50.849073,
    time: "18:30 – 22:00",
    vibe: "Open air · DJ set · free",
    price: 1,
    description:
      "Free open-air DJ set on the square with the basilica lit up behind. Bring a jacket, it gets cold after ten.",
    goingCount: 210,
    friendsGoing: [people.mara, people.sofie, people.noor],
    busy: true,
  },
  {
    id: "lumiere",
    name: "Lumière Cinema",
    category: "event",
    address: "Bassin 88 · Boschstraatkwartier",
    lng: 5.691102,
    lat: 50.85668,
    time: "21:15",
    vibe: "Late screening · bar after",
    price: 2,
    description:
      "Arthouse premiere in the old factory hall, then the bar stays open by the water until one.",
    goingCount: 38,
    friendsGoing: [people.noor],
  },
  {
    id: "zondag",
    name: "Zondag",
    category: "food",
    address: "Wycker Brugstraat 42 · Wyck",
    lng: 5.698562,
    lat: 50.849547,
    time: "18:00 – 00:00",
    vibe: "Dinner · natural wine",
    price: 2,
    description:
      "Small plates, a good wine list, and a terrace facing the Maas. Book, or come after nine.",
    goingCount: 19,
    friendsGoing: [],
  },
  {
    id: "the-duke",
    name: "The Duke",
    category: "bar",
    address: "Koestraat 15 · Jekerkwartier",
    lng: 5.692821,
    lat: 50.846622,
    time: "19:00 – 02:00",
    vibe: "Whisky bar · quiet",
    price: 3,
    description:
      "Leather chairs and 300 bottles. The place to actually hear what someone is saying.",
    goingCount: 12,
    friendsGoing: [],
  },
  {
    id: "leo-rooftop",
    name: "Leo’s Rooftop",
    category: "private",
    address: "Tongersestraat · Kommelkwartier",
    lng: 5.686538,
    lat: 50.846249,
    time: "21:00 – late",
    vibe: "Rooftop · BYOB",
    price: 1,
    description:
      "Leo’s roof above the Jeker. Shared playlist, a speaker, and a view over the city wall. Invited guests only.",
    goingCount: 11,
    friendsGoing: [people.leo, people.thies, people.mara],
    isPrivate: true,
    hostId: "leo",
  },
  {
    id: "cliniq",
    name: "Café Cliniq",
    category: "club",
    address: "Platielstraat 9A · Binnenstad",
    lng: 5.689933,
    lat: 50.848707,
    time: "22:00 – 04:00",
    vibe: "House · packed dancefloor",
    price: 2,
    description:
      "Small room, big speakers. Cliniq is the late-night house stop a few doors down from Prevenir.",
    goingCount: 86,
    friendsGoing: [people.sofie, people.jonas],
    busy: true,
  },
  {
    id: "roto",
    name: "Roto",
    category: "club",
    address: "Markt 25 · Binnenstad",
    lng: 5.689943,
    lat: 50.851985,
    time: "23:00 – 05:00",
    vibe: "Pop · student night",
    price: 1,
    description:
      "Above the Markt. Chart hits, sticky floor, last round at four if you can still find the bar.",
    goingCount: 121,
    friendsGoing: [people.finn, people.thies],
    busy: true,
  },
  {
    id: "night-live",
    name: "Night Live",
    category: "club",
    address: "Kesselskade 43 · Binnenstad",
    lng: 5.693611,
    lat: 50.850798,
    time: "22:30 – 04:00",
    vibe: "R&B · hip-hop · late",
    price: 2,
    description:
      "Kesselskade’s late club. Dress up a bit — door is picky after midnight.",
    goingCount: 102,
    friendsGoing: [people.mara, people.noor],
    busy: true,
  },
  {
    id: "moos",
    name: "MOOS",
    category: "club",
    address: "Capucijnenstraat 21 · Statenkwartier",
    lng: 5.685407,
    lat: 50.85284,
    time: "23:00 – 05:00",
    vibe: "Warehouse · techno",
    price: 2,
    description:
      "Warehouse nights in the Statenkwartier. Dark, loud, and usually sold out before the first bus.",
    goingCount: 134,
    friendsGoing: [people.thies, people.jonas],
    busy: true,
  },
  {
    id: "prevenir",
    name: "Prevenir",
    category: "bar",
    address: "Platielstraat 6 · Binnenstad",
    lng: 5.690042,
    lat: 50.848825,
    time: "21:00 – 03:00",
    vibe: "Cocktails · loud bar",
    price: 2,
    description:
      "The cocktail bar everyone walks past and then stays in. Negronis, a crush at the door, good lighting.",
    goingCount: 71,
    friendsGoing: [people.sofie, people.leo],
    busy: true,
  },
  {
    id: "tribunal",
    name: "Café Tribunal",
    category: "bar",
    address: "Tongersestraat · Kommelkwartier",
    lng: 5.687538,
    lat: 50.846461,
    time: "18:00 – 02:00",
    vibe: "Student café · terrace",
    price: 1,
    description:
      "Law-faculty brown café. Cheap pints, a packed terrace, and the default first stop of the night.",
    goingCount: 54,
    friendsGoing: [people.finn, people.jonas],
  },
  {
    id: "vogelstruys",
    name: "In den Ouden Vogelstruys",
    category: "bar",
    address: "Vrijthof 15 · Binnenstad",
    lng: 5.689273,
    lat: 50.848853,
    time: "17:00 – 02:00",
    vibe: "Oldest café · Vrijthof",
    price: 2,
    description:
      "Maastricht’s oldest café on the square. Amber light, local beers, and a table if you get there early.",
    goingCount: 41,
    friendsGoing: [people.noor],
  },
  {
    id: "charlemagne",
    name: "Café Charlemagne",
    category: "bar",
    address: "Onze Lieve Vrouweplein 24 · Binnenstad",
    lng: 5.69265,
    lat: 50.847571,
    time: "19:00 – 02:00",
    vibe: "Plaza terrace · beers",
    price: 2,
    description:
      "Tables on Onze Lieve Vrouweplein. Fine for a first beer and people-watching under the basilica.",
    goingCount: 33,
    friendsGoing: [people.mara],
  },
  {
    id: "gouverneur",
    name: "De Gouverneur",
    category: "bar",
    address: "Boschstraat 105A · Boschstraatkwartier",
    lng: 5.690492,
    lat: 50.852427,
    time: "18:00 – 01:00",
    vibe: "Brewery tap · local ales",
    price: 2,
    description:
      "House beers from the Gouverneur brewery. Wood, copper, and a crowd that stays for one more.",
    goingCount: 29,
    friendsGoing: [people.leo],
  },
  {
    id: "cafe-madrid",
    name: "Café Madrid",
    category: "bar",
    address: "Bredestraat 18 · Binnenstad",
    lng: 5.690139,
    lat: 50.848213,
    time: "20:00 – 03:00",
    vibe: "Late bar · shots",
    price: 1,
    description:
      "Next door to Take Five. Loud, cheap, and the place you end up after the jazz set.",
    goingCount: 48,
    friendsGoing: [people.finn, people.sofie],
  },
  {
    id: "muziekgieterij",
    name: "Muziekgieterij",
    category: "event",
    address: "Richie Backfireplein · Boschstraatkwartier",
    lng: 5.690747,
    lat: 50.857018,
    time: "20:30 – 02:00",
    vibe: "Live gig · standing",
    price: 2,
    description:
      "Maastricht’s main live room in the Sphinxkwartier. Doors 20:00, support at 20:30, headliner after.",
    goingCount: 176,
    friendsGoing: [people.thies, people.noor, people.jonas],
    busy: true,
  },
  {
    id: "pathe",
    name: "Pathé Sphinx",
    category: "event",
    address: "Sphinxcour 1 · Statenkwartier",
    lng: 5.689711,
    lat: 50.85586,
    time: "21:40 – 02:00",
    vibe: "Late screening · popcorn",
    price: 2,
    description:
      "Late screening in the old factory. Bar in the lobby stays open after the credits.",
    goingCount: 44,
    friendsGoing: [people.sofie],
  },
  {
    id: "theater-vrijthof",
    name: "Theater aan het Vrijthof",
    category: "event",
    address: "Vrijthof · Binnenstad",
    lng: 5.687979,
    lat: 50.850222,
    time: "20:00 – 00:30",
    vibe: "Stage · night out",
    price: 3,
    description:
      "Evening show in the main hall. Interval drinks, then everyone spills onto the square.",
    goingCount: 89,
    friendsGoing: [people.mara, people.leo],
  },
  {
    id: "toneelgroep",
    name: "Toneelgroep Maastricht",
    category: "event",
    address: "Aan de Recentoren 1 · Wyck",
    lng: 5.699994,
    lat: 50.845928,
    time: "19:30 – 00:30",
    vibe: "Theatre · Wyck",
    price: 2,
    description:
      "New work in the Wyck hall. Short run tonight — then the Rechtstraat bars.",
    goingCount: 31,
    friendsGoing: [people.noor],
  },
  {
    id: "sjiek",
    name: "Café Sjiek",
    category: "food",
    address: "Sint Pieterstraat 13 · Jekerkwartier",
    lng: 5.692419,
    lat: 50.845379,
    time: "18:00 – 01:00",
    vibe: "Limburg kitchen · wine",
    price: 2,
    description:
      "Classic Maastricht kitchen in the Jekerkwartier. Book the back room or squeeze in at the bar.",
    goingCount: 26,
    friendsGoing: [people.leo, people.mara],
  },
  {
    id: "reitz",
    name: "Friture Reitz",
    category: "food",
    address: "Markt 75 · Binnenstad",
    lng: 5.690621,
    lat: 50.850777,
    time: "17:00 – 04:00",
    vibe: "Fries · late snack",
    price: 1,
    description:
      "The Markt friture. A cone of fries is the official last course of every night out.",
    goingCount: 58,
    friendsGoing: [people.finn, people.jonas],
    busy: true,
  },
  {
    id: "amadeus",
    name: "Amadeus",
    category: "food",
    address: "Dominicanerplein 1a · Binnenstad",
    lng: 5.6895,
    lat: 50.850248,
    time: "18:00 – 01:00",
    vibe: "Grand café · plaza",
    price: 2,
    description:
      "Grand café on Dominicanerplein. Steaks, a long wine list, and a terrace that fills after the shops close.",
    goingCount: 22,
    friendsGoing: [people.sofie],
  },
  {
    id: "bar-beurre",
    name: "Bar Beurre",
    category: "food",
    address: "Sint Pieterstraat · Jekerkwartier",
    lng: 5.691823,
    lat: 50.844985,
    time: "18:30 – 01:00",
    vibe: "Small plates · natural wine",
    price: 3,
    description:
      "Small plates and butter-yellow light in the Jekerkwartier. Come hungry, leave slowly.",
    goingCount: 17,
    friendsGoing: [people.noor, people.mara],
  },
  {
    id: "brandweer",
    name: "De Brandweer Kantine",
    category: "food",
    address: "Capucijnenstraat 21 · Statenkwartier",
    lng: 5.685154,
    lat: 50.853101,
    time: "18:00 – 03:00",
    vibe: "Canteen · pizza · beers",
    price: 1,
    description:
      "Fire-station canteen turned hangout. Pizza, cheap beer, and a crowd that never quite leaves.",
    goingCount: 39,
    friendsGoing: [people.thies],
  },
  {
    id: "henrik-loft",
    name: "Henrik’s Loft",
    category: "private",
    address: "Wycker Grachtstraat · Wyck",
    lng: 5.69912,
    lat: 50.84855,
    time: "21:00 – late",
    vibe: "Loft · open house",
    price: 1,
    description:
      "Henrik’s place above Wyck. Speakers in the window, snacks on the table, friends of friends welcome.",
    goingCount: 8,
    friendsGoing: [people.leo, people.sofie],
    isPrivate: true,
    hostId: "me",
    openJoin: true,
  },
  {
    id: "mara-canal",
    name: "Mara’s Canal House",
    category: "private",
    address: "Bassin · Boschstraatkwartier",
    lng: 5.6914,
    lat: 50.8559,
    time: "20:30 – late",
    vibe: "Canal · kitchen party",
    price: 1,
    description:
      "Mara’s kitchen table by the Bassin. Bring a bottle — she’ll cook if you help chop.",
    goingCount: 6,
    friendsGoing: [people.mara, people.noor],
    isPrivate: true,
    hostId: "mara",
  },
];

/**
 * Venues that carry a local name but are not named in OpenStreetMap.
 * Their coordinates were resolved from the street address, so the marker
 * still lands on the correct building.
 */
const extraPlaces: Place[] = [
  {
    id: "place-prevenir",
    name: "Prevenir",
    address: "Platielstraat 6 \u00b7 Binnenstad",
    lng: 5.690042,
    lat: 50.848825,
    kind: "bar",
  },
  {
    id: "place-night-live",
    name: "Night Live",
    address: "Kesselskade 43 \u00b7 Binnenstad",
    lng: 5.693611,
    lat: 50.850798,
    kind: "club",
  },
  {
    id: "place-moos",
    name: "MOOS",
    address: "Capucijnenstraat 21 \u00b7 Statenkwartier",
    lng: 5.685407,
    lat: 50.85284,
    kind: "club",
  },
];

function categoryToKind(category: Category): PlaceKind {
  if (category === "private") return "other";
  return category;
}

/**
 * Searchable Maastricht spots: tonight's venues first, then the OpenStreetMap
 * dataset, then the few hand-resolved extras. Duplicates are dropped by
 * name + street so a venue never appears twice in the address picker.
 */
export const maastrichtPlaces: Place[] = (() => {
  const all: Place[] = [
    ...venues.map((v) => ({
      id: `venue-${v.id}`,
      name: v.name,
      address: v.address,
      lng: v.lng,
      lat: v.lat,
      kind: categoryToKind(v.category),
    })),
    ...extraPlaces,
    ...osmPlaces,
  ];
  const seen = new Set<string>();
  return all.filter((p) => {
    const key = `${p.name.toLowerCase()}|${p.address.split("\u00b7")[0].trim().toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
})();

export const invitations: Invitation[] = [
  {
    id: "inv-leo",
    venueId: "leo-rooftop",
    from: people.leo,
    message: "Rooftop tonight from nine. Bring something to drink — I’ve got the speaker.",
    headline: "Rooftop tonight. You’re on the list.",
    bring: "Something to drink",
    areaHint: "Tongersestraat",
  },
  {
    id: "inv-mara",
    venueId: "mara-canal",
    from: people.mara,
    message: "Canal house from half eight. I’ve got pasta if you bring wine.",
    headline: "Pasta at the canal house.",
    bring: "A bottle of wine",
    areaHint: "Bassin",
  },
];

export const categoryMeta: Record<
  Exclude<Category, "private"> | "all",
  { label: string }
> = {
  all: { label: "All" },
  bar: { label: "Bars" },
  club: { label: "Clubs" },
  event: { label: "Events" },
  food: { label: "Food" },
};

/**
 * SAMPLE DATA (Phase 1 demo, not stored anywhere): where friends are right
 * now and where they head next, for the desktop Friends view. Real friend
 * locations need auth, a friends table and consent (PRODUCT_UI_DIRECTION,
 * "What this needs beyond UI"). Times are Maastricht clock, "HH:MM".
 */
export type FriendPlan = {
  personId: string;
  /** Where they are now. */
  atVenueId: string;
  since: string;
  /** Where they're heading next, if they said. */
  nextVenueId?: string;
  nextAt?: string;
  /** They're hosting a private night at `atVenueId`. */
  hosting?: boolean;
};

export const friendPlans: FriendPlan[] = [
  { personId: "thies", atVenueId: "take-five", since: "21:10", nextVenueId: "complex", nextAt: "23:30" },
  { personId: "mara", atVenueId: "vogelstruys", since: "22:05", nextVenueId: "complex", nextAt: "23:30" },
  { personId: "jonas", atVenueId: "tribunal", since: "20:30", nextVenueId: "complex", nextAt: "23:45" },
  { personId: "sofie", atVenueId: "prevenir", since: "21:40", nextVenueId: "cliniq", nextAt: "00:00" },
  { personId: "noor", atVenueId: "vogelstruys", since: "21:50", nextVenueId: "night-live", nextAt: "23:15" },
  { personId: "finn", atVenueId: "de-poshoorn", since: "20:15", nextVenueId: "roto", nextAt: "23:30" },
  { personId: "leo", atVenueId: "leo-rooftop", since: "21:00", hosting: true },
];

export const MAASTRICHT_CENTER: [number, number] = [5.6925, 50.8515];
export const MAASTRICHT_CENTER_MOBILE: [number, number] = [5.693, 50.8538];
