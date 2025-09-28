export const PHILADELPHIA_NEIGHBORHOODS = [
    'Center City',
    'Fishtown',
    'Northern Liberties',
    'Graduate Hospital',
    'South Philadelphia',
    'Queen Village',
    'Bella Vista',
    'Rittenhouse Square',
    'Washington Square West',
    'Old City',
    'Society Hill',
    'Port Richmond',
    'Kensington',
    'Fairmount',
    'Brewerytown',
    'Strawberry Mansion',
    'Point Breeze',
    'Passyunk Square',
    'East Passyunk',
    'Dickinson Narrows',
    'Pennsport',
    'Whitman',
    'University City',
    'Powelton Village',
    'Mantua',
    'Spruce Hill',
    'Cedar Park',
    'Walnut Hill',
    'Overbrook',
    'West Philadelphia',
    'Germantown',
    'Mount Airy',
    'Chestnut Hill',
    'East Mount Airy',
    'West Mount Airy',
    'Nicetown',
    'Tioga',
    'Hunting Park',
    'Frankford',
    'Mayfair',
    'Holmesburg',
    'Tacony',
    'Wissinoming',
    'Bridesburg',
    'Richmond',
    'Roxborough',
    'Manayunk',
    'Wissahickon',
    'East Oak Lane',
    'West Oak Lane',
    'Logan',
    'Olney',
    'Feltonville'
];

export const UNIVERSITY_AREAS = [
    'University City',
    'Powelton Village',
    'Spruce Hill',
    'Cedar Park',
    'Walnut Hill'
];

export const POPULAR_NEIGHBORHOODS = [
    'Center City',
    'Fishtown',
    'Northern Liberties',
    'Graduate Hospital',
    'Rittenhouse Square',
    'University City',
    'South Philadelphia',
    'Queen Village',
    'Old City',
    'Manayunk'
];

export function extractNeighborhood(address: string): string | null {
    const normalizedAddress = address.toLowerCase();

    for (const neighborhood of PHILADELPHIA_NEIGHBORHOODS) {
        if (normalizedAddress.includes(neighborhood.toLowerCase())) {
            return neighborhood;
        }
    }

    return null;
}

export function isUniversityArea(neighborhood: string): boolean {
    return UNIVERSITY_AREAS.includes(neighborhood);
}
