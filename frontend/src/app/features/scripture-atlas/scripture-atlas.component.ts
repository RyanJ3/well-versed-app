import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

interface City {
  id: string;
  name: string;
  modern: string;
  position: [number, number];
  description: string;
  verses: string[];
  events: string[];
  keyFact: string;
}

@Component({
  selector: 'app-scripture-atlas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scripture-atlas.component.html',
  styleUrls: ['./scripture-atlas.component.scss']
})
export class ScriptureAtlasComponent implements OnInit, AfterViewInit {
  cities: City[] = [
    {
      id: 'antioch-syria',
      name: 'Antioch (Syria)',
      modern: 'Antakya, Turkey',
      position: [36.2, 36.16],
      description: 'Starting point where Paul and Barnabas were commissioned',
      verses: ['Acts 13:1-3'],
      events: [
        'Church fasted and prayed',
        'Holy Spirit said "Set apart Barnabas and Saul"',
        'Laid hands and sent them off'
      ],
      keyFact: 'Third largest city in the Roman Empire at the time'
    },
    {
      id: 'seleucia',
      name: 'Seleucia',
      modern: 'Port of Antioch',
      position: [36.12, 35.93],
      description: 'Port city where they sailed to Cyprus',
      verses: ['Acts 13:4'],
      events: ['Departed by ship to Cyprus'],
      keyFact: 'Located 16 miles from Antioch, at the mouth of the Orontes River'
    },
    {
      id: 'salamis',
      name: 'Salamis',
      modern: 'Eastern Cyprus',
      position: [35.18, 33.9],
      description: 'First stop in Cyprus, proclaimed in synagogues',
      verses: ['Acts 13:5'],
      events: [
        'Proclaimed the word in Jewish synagogues',
        'John Mark was their assistant'
      ],
      keyFact: 'Largest city and commercial center of Cyprus'
    },
    {
      id: 'paphos',
      name: 'Paphos',
      modern: 'Western Cyprus',
      position: [34.77, 32.42],
      description: 'Capital of Cyprus, encountered the proconsul',
      verses: ['Acts 13:6-12'],
      events: [
        'Met Bar-Jesus (Elymas) the sorcerer',
        'Proconsul Sergius Paulus believed',
        'Paul struck Elymas blind'
      ],
      keyFact: 'First recorded conversion of a Roman government official'
    },
    {
      id: 'perga',
      name: 'Perga',
      modern: 'Antalya region, Turkey',
      position: [36.89, 30.85],
      description: 'First mainland stop where John Mark left',
      verses: ['Acts 13:13'],
      events: [
        'John Mark departed to Jerusalem',
        'Paul and Barnabas continued inland'
      ],
      keyFact: 'John Mark\'s departure later caused conflict between Paul and Barnabas'
    },
    {
      id: 'pisidian-antioch',
      name: 'Pisidian Antioch',
      modern: 'Yalvaç, Turkey',
      position: [38.3, 31.2],
      description: "Location of Paul's first recorded sermon",
      verses: ['Acts 13:14-52'],
      events: [
        "Paul's powerful synagogue sermon",
        'Many Gentiles believed',
        'Jews stirred up persecution',
        'Shook dust off their feet'
      ],
      keyFact: "Contains Paul's longest recorded sermon in Acts"
    },
    {
      id: 'iconium',
      name: 'Iconium',
      modern: 'Konya, Turkey',
      position: [37.87, 32.49],
      description: 'Spent considerable time with great success',
      verses: ['Acts 14:1-7'],
      events: [
        'Great number believed',
        'City was divided',
        'Fled from stoning attempt',
        'Performed signs and wonders'
      ],
      keyFact: "Modern Konya is Turkey's 7th largest city"
    },
    {
      id: 'lystra',
      name: 'Lystra',
      modern: 'Near Konya, Turkey',
      position: [37.58, 32.45],
      description: 'Paul healed a lame man and was stoned',
      verses: ['Acts 14:8-20'],
      events: [
        'Healed man lame from birth',
        'Mistaken for gods (Zeus and Hermes)',
        'Paul stoned and left for dead',
        'Disciples gathered, Paul rose up'
      ],
      keyFact: "Timothy's hometown (met on 2nd journey)"
    },
    {
      id: 'derbe',
      name: 'Derbe',
      modern: 'Near Karaman, Turkey',
      position: [37.35, 33.25],
      description: 'Easternmost point, made many disciples',
      verses: ['Acts 14:20-21'],
      events: [
        'Preached the gospel',
        'Made many disciples',
        'No recorded persecution',
        'Began return journey'
      ],
      keyFact: 'Only city without recorded opposition'
    }
  ];

  memorized = new Set<string>();
  selectedCity: City | null = null;
  map!: L.Map;
  markers: { [id: string]: L.Marker } = {};

  ngOnInit() {}

  ngAfterViewInit() {
    this.map = L.map('atlas-map').setView([36.5, 33], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    const route = this.cities.map(c => c.position);
    L.polyline(route, {
      color: '#dc2626',
      weight: 3,
      opacity: 0.6,
      dashArray: '10,5'
    }).addTo(this.map);

    this.cities.forEach((city, idx) => {
      const icon = this.createIcon('#3b82f6');
      const marker = L.marker(city.position, { icon }).addTo(this.map);
      marker.on('click', () => this.selectCity(city));
      marker.bindTooltip(`${idx + 1}. ${city.name}`, { permanent: true, direction: 'top', offset: [0, -20] });
      this.markers[city.id] = marker;
    });
  }

  selectCity(city: City) {
    this.selectedCity = city;
    Object.entries(this.markers).forEach(([id, marker]) => {
      marker.setIcon(this.createIcon(id === city.id ? '#dc2626' : '#3b82f6', this.memorized.has(id)));
    });
  }

  toggleMemorized(cityId: string) {
    if (this.memorized.has(cityId)) {
      this.memorized.delete(cityId);
    } else {
      this.memorized.add(cityId);
    }
    this.selectCity(this.cities.find(c => c.id === cityId)!);
  }

  createIcon(color: string, isMemorized = false): L.DivIcon {
    const styles = `
      background-color: ${color};
      width: 2rem;
      height: 2rem;
      display: block;
      left: -1rem;
      top: -1rem;
      position: relative;
      border-radius: 2rem 2rem 0;
      transform: rotate(45deg);
      border: 2px solid ${isMemorized ? '#10b981' : '#FFFFFF'};
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    `;
    return L.divIcon({
      className: 'custom-pin',
      iconAnchor: [16, 32],
      labelAnchor: [-6, 0],
      popupAnchor: [0, -32],
      html: `<span style="${styles}" />`
    });
  }
}
