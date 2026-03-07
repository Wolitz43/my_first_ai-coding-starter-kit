import { EventCategory } from "@/lib/events";

// Regensburg city center
const REGENSBURG_LAT = 49.0134;
const REGENSBURG_LNG = 12.1016;
const RADIUS_KM = 10;
// Meetup radius is in miles
const RADIUS_MILES = Math.round(RADIUS_KM * 0.621371);

const MEETUP_GRAPHQL_URL = "https://api.meetup.com/gql";

export interface MeetupEvent {
  id: string;
  title: string;
  description: string | null;
  dateTime: string;       // ISO 8601
  endTime: string | null;
  eventUrl: string;
  venue: {
    name: string;
    address: string | null;
    city: string | null;
    lat: number | null;
    lng: number | null;
  } | null;
  group: {
    name: string;
    category: { name: string } | null;
  };
}

interface GraphQLResponse {
  data?: {
    keywordSearch?: {
      edges: Array<{
        node: {
          result: MeetupEvent | { __typename: string };
        };
      }>;
    };
  };
  errors?: Array<{ message: string }>;
}

const QUERY = `
  query UpcomingEventsRegensburg($lat: Float!, $lon: Float!, $radius: Int!) {
    keywordSearch(
      filter: { query: "", lat: $lat, lon: $lon, radius: $radius, source: EVENTS }
      input: { first: 100 }
    ) {
      edges {
        node {
          result {
            __typename
            ... on Event {
              id
              title
              description
              dateTime
              endTime
              eventUrl
              venue {
                name
                address
                city
                lat
                lng
              }
              group {
                name
                category {
                  name
                }
              }
            }
          }
        }
      }
    }
  }
`;

export async function fetchMeetupEvents(apiKey: string): Promise<MeetupEvent[]> {
  const response = await fetch(MEETUP_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query: QUERY,
      variables: {
        lat: REGENSBURG_LAT,
        lon: REGENSBURG_LNG,
        radius: RADIUS_MILES,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Meetup API HTTP error: ${response.status} ${response.statusText}`);
  }

  const json = (await response.json()) as GraphQLResponse;

  if (json.errors?.length) {
    throw new Error(`Meetup GraphQL error: ${json.errors.map((e) => e.message).join(", ")}`);
  }

  const edges = json.data?.keywordSearch?.edges ?? [];

  return edges
    .map((edge) => edge.node.result)
    .filter((result): result is MeetupEvent => {
      return (result as MeetupEvent).id !== undefined;
    });
}

export function mapMeetupCategory(categoryName: string | null | undefined): EventCategory {
  const name = (categoryName ?? "").toLowerCase();
  if (name.includes("music") || name.includes("musik")) return "Musik";
  if (
    name.includes("sport") ||
    name.includes("fitness") ||
    name.includes("outdoor") ||
    name.includes("hiking")
  )
    return "Sport";
  if (
    name.includes("art") ||
    name.includes("culture") ||
    name.includes("kultur") ||
    name.includes("theater") ||
    name.includes("film") ||
    name.includes("photo")
  )
    return "Kunst & Kultur";
  if (
    name.includes("food") ||
    name.includes("drink") ||
    name.includes("dining") ||
    name.includes("essen")
  )
    return "Essen & Trinken";
  if (
    name.includes("community") ||
    name.includes("social") ||
    name.includes("networking") ||
    name.includes("tech") ||
    name.includes("education") ||
    name.includes("career")
  )
    return "Community";
  return "Sonstiges";
}
