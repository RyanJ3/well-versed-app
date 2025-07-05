import { Injectable } from '@angular/core';

export interface HistoricalBuilding {
  name: string;
  location: { lat: number; lng: number };
  period: string;
  height: number;
  color: string;
  description: string;
  features: BuildingFeature[];
}

export interface BuildingFeature {
  type: string;
  coordinates: number[][];
  height: number;
  color: string;
  outline?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class HistoricalBuildingsService {
  private buildings: HistoricalBuilding[] = [
  {
    "name": "Solomon's Temple",
    "location": {
      "lat": 31.7784,
      "lng": 35.2356
    },
    "period": "957-586 BCE",
    "height": 30,
    "color": "#D4AF37",
    "description": "The First Temple built by King Solomon",
    "features": [
      {
        "type": "main_building",
        "coordinates": [
          [
            35.2354,
            31.7782
          ],
          [
            35.2358,
            31.7782
          ],
          [
            35.2358,
            31.7786
          ],
          [
            35.2354,
            31.7786
          ],
          [
            35.2354,
            31.7782
          ]
        ],
        "height": 30,
        "color": "#D4AF37"
      },
      {
        "type": "holy_of_holies",
        "coordinates": [
          [
            35.2355,
            31.7783
          ],
          [
            35.2357,
            31.7783
          ],
          [
            35.2357,
            31.7785
          ],
          [
            35.2355,
            31.7785
          ],
          [
            35.2355,
            31.7783
          ]
        ],
        "height": 35,
        "color": "#FFD700"
      },
      {
        "type": "courtyard",
        "coordinates": [
          [
            35.2352,
            31.778
          ],
          [
            35.236,
            31.778
          ],
          [
            35.236,
            31.7788
          ],
          [
            35.2352,
            31.7788
          ],
          [
            35.2352,
            31.778
          ]
        ],
        "height": 5,
        "color": "#DEB887"
      }
    ]
  },
  {
    "name": "Herod's Temple (Second Temple)",
    "location": {
      "lat": 31.778,
      "lng": 35.2354
    },
    "period": "516 BCE - 70 CE",
    "height": 45,
    "color": "#F5DEB3",
    "description": "The Second Temple, expanded by Herod the Great",
    "features": [
      {
        "type": "temple_mount",
        "coordinates": [
          [
            35.234,
            31.777
          ],
          [
            35.2368,
            31.777
          ],
          [
            35.2368,
            31.779
          ],
          [
            35.234,
            31.779
          ],
          [
            35.234,
            31.777
          ]
        ],
        "height": 10,
        "color": "#D2B48C"
      },
      {
        "type": "sanctuary",
        "coordinates": [
          [
            35.2352,
            31.7778
          ],
          [
            35.2356,
            31.7778
          ],
          [
            35.2356,
            31.7782
          ],
          [
            35.2352,
            31.7782
          ],
          [
            35.2352,
            31.7778
          ]
        ],
        "height": 45,
        "color": "#F5DEB3"
      }
    ]
  },
  {
    "name": "Tower of Babel",
    "location": {
      "lat": 32.5355,
      "lng": 44.4209
    },
    "period": "~2200 BCE",
    "height": 90,
    "color": "#8B4513",
    "description": "The legendary tower from Genesis",
    "features": [
      {
        "type": "ziggurat",
        "coordinates": [
          [
            44.4207,
            32.5353
          ],
          [
            44.4211,
            32.5353
          ],
          [
            44.4211,
            32.5357
          ],
          [
            44.4207,
            32.5357
          ],
          [
            44.4207,
            32.5353
          ]
        ],
        "height": 90,
        "color": "#8B4513"
      }
    ]
  },
  {
    "name": "Walls of Jericho",
    "location": {
      "lat": 31.8711,
      "lng": 35.4436
    },
    "period": "~1400 BCE",
    "height": 12,
    "color": "#CD853F",
    "description": "The ancient walls that fell at Joshua's command",
    "features": [
      {
        "type": "city_walls",
        "coordinates": [
          [
            35.442,
            31.87
          ],
          [
            35.4452,
            31.87
          ],
          [
            35.4452,
            31.8722
          ],
          [
            35.442,
            31.8722
          ],
          [
            35.442,
            31.87
          ]
        ],
        "height": 12,
        "color": "#CD853F",
        "outline": true
      }
    ]
  },
  {
    "name": "Tabernacle at Shiloh",
    "location": {
      "lat": 32.0556,
      "lng": 35.2897
    },
    "period": "1400-1000 BCE",
    "height": 5,
    "color": "#8B6914",
    "description": "The portable sanctuary before the Temple",
    "features": [
      {
        "type": "tent_structure",
        "coordinates": [
          [
            35.2895,
            32.0554
          ],
          [
            35.2899,
            32.0554
          ],
          [
            35.2899,
            32.0558
          ],
          [
            35.2895,
            32.0558
          ],
          [
            35.2895,
            32.0554
          ]
        ],
        "height": 5,
        "color": "#8B6914"
      }
    ]
  }
];

  getBuildings(): HistoricalBuilding[] {
    return this.buildings;
  }

  getBuildingsByLocation(lat: number, lng: number, radiusKm: number = 5): HistoricalBuilding[] {
    return this.buildings.filter(building => {
      const distance = this.calculateDistance(
        lat, lng,
        building.location.lat, building.location.lng
      );
      return distance <= radiusKm;
    });
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI/180);
  }
}
