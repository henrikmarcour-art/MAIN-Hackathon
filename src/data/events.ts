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

export type PlaceKind = "bar" | "club" | "event" | "food" | "other";

export type Place = {
  id: string;
  name: string;
  address: string;
  lng: number;
  lat: number;
  kind: PlaceKind;
};

export const venues: Venue[] = [
  {
    id: "complex",
    name: "Complex",
    category: "club",
    address: "Bassin 102 · Sphinxkwartier",
    lng: 5.6878,
    lat: 50.8565,
    time: "23:00 – 05:00",
    vibe: "Techno · basement · loud",
    price: 2,
    description:
      "Maastricht’s underground club in the old Sphinx factory. Tonight: local residents, dark room, no phones on the floor.",
    goingCount: 148,
    friendsGoing: [people.thies, people.mara, people.jonas],
    busy: true,
  },
  {
    id: "take-five",
    name: "Take Five",
    category: "bar",
    address: "Markt 20 · Centrum",
    lng: 5.6903,
    lat: 50.8516,
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
    lng: 5.7013,
    lat: 50.8492,
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
    address: "Brusselsestraat 1 · Centrum",
    lng: 5.6851,
    lat: 50.8508,
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
    address: "Vrijthof · Centrum",
    lng: 5.6885,
    lat: 50.8493,
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
    address: "Bassin 88 · Sphinxkwartier",
    lng: 5.6845,
    lat: 50.8543,
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
    lng: 5.6993,
    lat: 50.8484,
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
    address: "Rechtstraat 96 · Wyck",
    lng: 5.7016,
    lat: 50.8476,
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
    address: "Tongersestraat · Jekerkwartier",
    lng: 5.6862,
    lat: 50.8466,
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
];

const extraPlaces: Place[] = [
  {
    id: "place-cafe-forum",
    name: "Café Forum",
    address: "Mariastraat 7 · Centrum",
    lng: 5.6889,
    lat: 50.8487,
    kind: "bar",
  },
  {
    id: "place-prevenir",
    name: "Prevenir",
    address: "Platielstraat 6 · Centrum",
    lng: 5.6908,
    lat: 50.8498,
    kind: "bar",
  },
  {
    id: "place-tribunaal",
    name: "In Den Ouden Vogelstruys",
    address: "Vrijthof 15 · Centrum",
    lng: 5.6892,
    lat: 50.8491,
    kind: "bar",
  },
  {
    id: "place-night-live",
    name: "Night Live",
    address: "Kesselskade 43 · Centrum",
    lng: 5.6944,
    lat: 50.8496,
    kind: "club",
  },
  {
    id: "place-moos",
    name: "MOOS",
    address: "Capucijnenstraat 21 · Kommelkwartier",
    lng: 5.6856,
    lat: 50.8499,
    kind: "club",
  },
  {
    id: "place-petit-bonheur",
    name: "Petit Bonheur",
    address: "Rechtstraat 42 · Wyck",
    lng: 5.7008,
    lat: 50.8488,
    kind: "food",
  },
];

function categoryToKind(category: Category): PlaceKind {
  if (category === "private") return "other";
  return category;
}

/** Searchable Maastricht spots (venues + extra bars/clubs/food). */
export const maastrichtPlaces: Place[] = [
  ...venues.map((v) => ({
    id: `venue-${v.id}`,
    name: v.name,
    address: v.address,
    lng: v.lng,
    lat: v.lat,
    kind: categoryToKind(v.category),
  })),
  ...extraPlaces,
];

export const invitations: Invitation[] = [
  {
    id: "inv-leo",
    venueId: "leo-rooftop",
    from: people.leo,
    message: "Rooftop tonight from nine. Bring something to drink — I’ve got the speaker.",
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

export const MAASTRICHT_CENTER: [number, number] = [5.6925, 50.8515];
export const MAASTRICHT_CENTER_MOBILE: [number, number] = [5.693, 50.8538];
