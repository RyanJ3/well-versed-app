import { Component, OnInit, AfterViewInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { interval, Subscription } from 'rxjs';

declare const L: any;

interface City {
  id: string;
  name: string;
  modern: string;
  position: [number, number];
  description: string;
  verses: string[];
  events: string[];
  keyFact: string;
  scriptureText?: string;
}

interface Particle {
  x: number;
  y: number;
  duration: number;
  delay: number;
}

@Component({
  selector: 'app-scripture-atlas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scripture-atlas.component.html',
  styleUrls: ['./scripture-atlas.component.scss'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class ScriptureAtlasComponent implements OnInit, AfterViewInit, OnDestroy {
  // City data
  cities: City[] = [
    {
      id: 'antioch-syria',
      name: 'Antioch (Syria)',
      modern: 'Antakya, Turkey',
      position: [36.2, 36.16],
      description: 'The starting point where Paul and Barnabas were commissioned by the church for their groundbreaking missionary journey.',
      verses: ['Acts 13:1-3'],
      events: [
        'Church fasted and prayed for guidance',
        'Holy Spirit said "Set apart Barnabas and Saul"',
        'Leaders laid hands and sent them off',
        'First organized missionary expedition'
      ],
      keyFact: 'Third largest city in the Roman Empire after Rome and Alexandria, with over 500,000 residents. Known as the "Crown of the East."',
      scriptureText: '<span class="verse"><span class="verse-number">1</span>Now in the church at Antioch there were prophets and teachers: Barnabas, Simeon called Niger, Lucius of Cyrene, Manaen (who had been brought up with Herod the tetrarch) and Saul.</span> <span class="verse"><span class="verse-number">2</span>While they were worshiping the Lord and fasting, the Holy Spirit said, "Set apart for me Barnabas and Saul for the work to which I have called them."</span> <span class="verse"><span class="verse-number">3</span>So after they had fasted and prayed, they placed their hands on them and sent them off.</span>'
    },
    {
      id: 'seleucia',
      name: 'Seleucia',
      modern: 'Port of Antioch',
      position: [36.12, 35.93],
      description: 'The port city where they set sail for Cyprus, marking the beginning of their sea voyage.',
      verses: ['Acts 13:4'],
      events: ['Departed by ship to Cyprus', 'Beginning of maritime mission'],
      keyFact: 'Located 16 miles from Antioch at the mouth of the Orontes River. Founded by Seleucus I, one of Alexander\'s generals.',
      scriptureText: '<span class="verse"><span class="verse-number">4</span>The two of them, sent on their way by the Holy Spirit, went down to Seleucia and sailed from there to Cyprus.</span>'
    },
    {
      id: 'salamis',
      name: 'Salamis',
      modern: 'Near Famagusta, Cyprus',
      position: [35.18, 33.9],
      description: 'First evangelistic stop where they proclaimed the word in Jewish synagogues.',
      verses: ['Acts 13:5'],
      events: [
        'Proclaimed the word in Jewish synagogues',
        'John Mark served as their assistant',
        'Established pattern of synagogue preaching'
      ],
      keyFact: 'Largest city and commercial center of Cyprus, home to a significant Jewish population with multiple synagogues.',
      scriptureText: '<span class="verse"><span class="verse-number">5</span>When they arrived at Salamis, they proclaimed the word of God in the Jewish synagogues. John was with them as their helper.</span>'
    },
    {
      id: 'paphos',
      name: 'Paphos',
      modern: 'Paphos, Cyprus',
      position: [34.77, 32.42],
      description: 'Capital of Cyprus where they encountered both spiritual opposition and high-level conversion.',
      verses: ['Acts 13:6-12'],
      events: [
        'Met Bar-Jesus (Elymas) the sorcerer',
        'Proconsul Sergius Paulus believed',
        'Paul struck Elymas blind',
        'Paul emerged as mission leader'
      ],
      keyFact: 'First recorded conversion of a Roman government official to Christianity. The proconsul\'s conversion opened doors throughout the empire.',
      scriptureText: '<span class="verse"><span class="verse-number">6</span>They traveled through the whole island until they came to Paphos. There they met a Jewish sorcerer and false prophet named Bar-Jesus,</span> <span class="verse"><span class="verse-number">7</span>who was an attendant of the proconsul, Sergius Paulus. The proconsul, an intelligent man, sent for Barnabas and Saul because he wanted to hear the word of God.</span>'
    },
    {
      id: 'perga',
      name: 'Perga',
      modern: 'Near Antalya, Turkey',
      position: [36.89, 30.85],
      description: 'First mainland stop in Asia Minor where John Mark departed from the team.',
      verses: ['Acts 13:13'],
      events: [
        'John Mark departed to Jerusalem',
        'Team faced first major challenge',
        'Continued inland despite setback'
      ],
      keyFact: 'John Mark\'s departure later caused a sharp disagreement between Paul and Barnabas (Acts 15:37-39), leading to two missionary teams.',
      scriptureText: '<span class="verse"><span class="verse-number">13</span>From Paphos, Paul and his companions sailed to Perga in Pamphylia, where John left them to return to Jerusalem.</span>'
    },
    {
      id: 'pisidian-antioch',
      name: 'Pisidian Antioch',
      modern: 'Yalvaç, Turkey',
      position: [38.3, 31.2],
      description: 'Location of Paul\'s first recorded sermon and the beginning of deliberate Gentile outreach.',
      verses: ['Acts 13:14-52'],
      events: [
        'Paul\'s powerful synagogue sermon',
        'Many Gentiles believed',
        'Jewish leaders stirred persecution',
        'Shook dust off their feet'
      ],
      keyFact: 'Paul\'s longest recorded sermon in Acts established his pattern: preach to Jews first, then turn to Gentiles when rejected.',
      scriptureText: '<span class="verse"><span class="verse-number">14</span>From Perga they went on to Pisidian Antioch. On the Sabbath they entered the synagogue and sat down.</span> <span class="verse"><span class="verse-number">15</span>After the reading from the Law and the Prophets, the leaders of the synagogue sent word to them, saying, "Brothers, if you have a word of exhortation for the people, please speak."</span>'
    },
    {
      id: 'iconium',
      name: 'Iconium',
      modern: 'Konya, Turkey',
      position: [37.87, 32.49],
      description: 'Major city where they spent considerable time despite growing opposition.',
      verses: ['Acts 14:1-7'],
      events: [
        'Great number of Jews and Greeks believed',
        'City divided over the message',
        'Performed signs and wonders',
        'Fled from stoning attempt'
      ],
      keyFact: 'Modern Konya is Turkey\'s 7th largest city. In Paul\'s time, it was a key stop on the Via Sebaste trade route.',
      scriptureText: '<span class="verse"><span class="verse-number">1</span>At Iconium Paul and Barnabas went as usual into the Jewish synagogue. There they spoke so effectively that a great number of Jews and Greeks believed.</span>'
    },
    {
      id: 'lystra',
      name: 'Lystra',
      modern: 'Near Hatunsaray, Turkey',
      position: [37.58, 32.45],
      description: 'City where Paul healed a lame man, was worshipped as a god, then nearly killed.',
      verses: ['Acts 14:8-20'],
      events: [
        'Healed man lame from birth',
        'Mistaken for Zeus and Hermes',
        'Paul stoned and left for dead',
        'Miraculously recovered and continued'
      ],
      keyFact: 'Timothy\'s hometown - Paul met him here on his second journey. The dramatic events here prepared Timothy for missionary hardships.',
      scriptureText: '<span class="verse"><span class="verse-number">8</span>In Lystra there sat a man who was lame. He had been that way from birth and had never walked.</span> <span class="verse"><span class="verse-number">9</span>He listened to Paul as he was speaking. Paul looked directly at him, saw that he had faith to be healed</span> <span class="verse"><span class="verse-number">10</span>and called out, "Stand up on your feet!" At that, the man jumped up and began to walk.</span>'
    },
    {
      id: 'derbe',
      name: 'Derbe',
      modern: 'Near Karaman, Turkey',
      position: [37.35, 33.25],
      description: 'Easternmost point where they made many disciples before beginning the return journey.',
      verses: ['Acts 14:20-21'],
      events: [
        'Preached the gospel successfully',
        'Made many disciples',
        'No recorded persecution',
        'Began strengthening return journey'
      ],
      keyFact: 'The only city without recorded opposition - a welcome respite. They could have returned via the Cilician Gates but chose to revisit and strengthen the churches.',
      scriptureText: '<span class="verse"><span class="verse-number">20</span>But after the disciples had gathered around him, he got up and went back into the city. The next day he and Barnabas left for Derbe.</span> <span class="verse"><span class="verse-number">21</span>They preached the gospel in that city and won a large number of disciples. Then they returned to Lystra, Iconium and Antioch,</span>'
    }
  ];

  // State variables
  memorized = new Set<string>();
  versesRead = new Set<string>();
  selectedCity: City | null = null;
  currentCityIndex = 0;
  currentDistance = 0;
  timelineProgress = 0;
  scrollOffset = 0;
  
  // Feature toggles
  isPlaying = false;
  terrainView = false;
  splitView = false;
  openScripturePanel = false;
  showScripture = false;
  
  // Map instances
  modernMap!: any;
  ancientMap!: any;
  markers: { [id: string]: any } = {};
  ancientMarkers: { [id: string]: any } = {};
  
  // Animation
  playbackInterval?: Subscription;
  particles: Particle[] = [];
  
  // Distance data (cumulative miles)
  distances = [0, 16, 196, 286, 461, 561, 651, 671, 731];
  
  // Scripture text
  currentScriptureText = '';

  @HostListener('window:scroll', ['$event'])
  onScroll(event: Event) {
    this.scrollOffset = window.pageYOffset;
  }

  ngOnInit() {
    // Load saved progress
    const savedMemorized = localStorage.getItem('scripture-atlas-memorized');
    if (savedMemorized) {
      this.memorized = new Set(JSON.parse(savedMemorized));
    }
    
    const savedVersesRead = localStorage.getItem('scripture-atlas-verses-read');
    if (savedVersesRead) {
      this.versesRead = new Set(JSON.parse(savedVersesRead));
    }
    
    // Initialize particles
    this.initializeParticles();
  }

  ngAfterViewInit() {
    this.loadLeaflet().then(() => {
      this.initializeMaps();
      // Set initial city after maps are loaded
      if (this.cities.length > 0) {
        this.selectCity(this.cities[0]);
      }
    });
  }

  ngOnDestroy() {
    if (this.playbackInterval) {
      this.playbackInterval.unsubscribe();
    }
  }

  private initializeParticles() {
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: 15 + Math.random() * 20,
        delay: Math.random() * 20
      });
    }
  }

  private loadLeaflet(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof (window as any).L !== 'undefined') {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
  }

  private initializeMaps() {
    // Initialize modern map
    this.modernMap = L.map('modern-map', {
      zoomControl: true,
      attributionControl: true
    }).setView([36.5, 33], 7);

    // Add modern tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.modernMap);

    // Initialize ancient map if split view
    if (this.splitView) {
      this.initializeAncientMap();
    }

    // Add route and markers
    this.drawJourneyRoute(this.modernMap, this.markers);
    this.addCityMarkers(this.modernMap, this.markers);

    // Fit bounds
    const bounds = L.latLngBounds(this.cities.map(c => c.position));
    this.modernMap.fitBounds(bounds.pad(0.1));
  }

  private initializeAncientMap() {
    if (!document.getElementById('ancient-map')) {
      setTimeout(() => this.initializeAncientMap(), 100);
      return;
    }

    this.ancientMap = L.map('ancient-map', {
      zoomControl: false,
      attributionControl: false
    }).setView([36.5, 33], 7);

    // Add ancient-styled tile layer (sepia/vintage effect)
    L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg', {
      attribution: 'Map tiles by Stamen Design',
      maxZoom: 16
    }).addTo(this.ancientMap);

    // Add route and markers
    this.drawJourneyRoute(this.ancientMap, this.ancientMarkers, true);
    this.addCityMarkers(this.ancientMap, this.ancientMarkers, true);

    // Sync map movements
    this.modernMap.on('move', () => {
      if (this.ancientMap) {
        this.ancientMap.setView(this.modernMap.getCenter(), this.modernMap.getZoom(), { animate: false });
      }
    });

    const bounds = L.latLngBounds(this.cities.map(c => c.position));
    this.ancientMap.fitBounds(bounds.pad(0.1));
  }

  private drawJourneyRoute(map: any, markers: any, isAncient = false) {
    const route = this.cities.map(c => c.position);
    
    // Animated dashed line for journey
    const journeyLine = L.polyline(route, {
      color: isAncient ? '#8B4513' : '#ef4444',
      weight: 4,
      opacity: 0.8,
      dashArray: '15, 10',
      lineJoin: 'round'
    }).addTo(map);

    // Add arrow decorators for direction
    this.addArrowsToRoute(map, route, isAncient);
  }

  private addArrowsToRoute(map: any, route: [number, number][], isAncient: boolean) {
    for (let i = 0; i < route.length - 1; i++) {
      const start = route[i];
      const end = route[i + 1];
      const midpoint: [number, number] = [
        (start[0] + end[0]) / 2,
        (start[1] + end[1]) / 2
      ];

      const angle = Math.atan2(end[1] - start[1], end[0] - start[0]) * 180 / Math.PI;

      const arrowIcon = L.divIcon({
        className: 'route-arrow',
        html: `<div style="transform: rotate(${angle}deg); color: ${isAncient ? '#8B4513' : '#ef4444'};">→</div>`,
        iconSize: [20, 20]
      });

      L.marker(midpoint, { icon: arrowIcon, interactive: false }).addTo(map);
    }
  }

  private addCityMarkers(map: any, markersObj: any, isAncient = false) {
    this.cities.forEach((city, index) => {
      const icon = this.createCityIcon(index + 1, city.id, isAncient);
      const marker = L.marker(city.position, { icon }).addTo(map);
      
      marker.on('click', () => this.selectCity(city));
      
      // Custom popup
      const popupContent = `
        <div style="text-align: center; min-width: 150px;">
          <strong style="font-size: 1.1em; color: ${isAncient ? '#8B4513' : '#6366f1'}">
            ${city.name}
          </strong>
          <br>
          <span style="color: #666; font-size: 0.9em">${city.modern}</span>
          <br>
          <span style="color: #999; font-size: 0.8em">${city.verses.join(', ')}</span>
        </div>
      `;
      
      marker.bindPopup(popupContent, {
        offset: [0, -20]
      });
      
      markersObj[city.id] = marker;
    });
  }

  private createCityIcon(number: number, cityId: string, isAncient = false): any {
    const isSelected = this.selectedCity?.id === cityId;
    const isMemorized = this.memorized.has(cityId);
    
    const baseColor = isSelected ? '#ef4444' : (isAncient ? '#8B4513' : '#6366f1');
    const size = isSelected ? 48 : 40;
    
    const html = `
      <div class="custom-city-marker ${isSelected ? 'selected' : ''} ${isMemorized ? 'memorized' : ''}" 
           style="width: ${size}px; height: ${size}px; background: ${isSelected ? baseColor : 'white'}; border-color: ${baseColor};">
        <div class="marker-content" style="color: ${isSelected ? 'white' : baseColor}">
          ${number}
        </div>
        ${isMemorized ? '<div style="position: absolute; top: -8px; right: -8px; width: 20px; height: 20px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; border: 2px solid white;">✓</div>' : ''}
      </div>
    `;
    
    return L.divIcon({
      className: 'city-marker-wrapper',
      html: html,
      iconSize: [size, size],
      iconAnchor: [size/2, size]
    });
  }

  selectCity(city: City) {
    this.selectedCity = city;
    this.currentCityIndex = this.cities.indexOf(city);
    this.currentDistance = this.distances[this.currentCityIndex];
    this.timelineProgress = (this.currentCityIndex / (this.cities.length - 1)) * 100;
    this.currentScriptureText = city.scriptureText || '';
    
    // Update markers
    this.updateMarkers();
    
    // Pan to city only if map is initialized
    if (this.modernMap) {
      this.modernMap.panTo(city.position, { animate: true, duration: 0.5 });
    }
    if (this.ancientMap) {
      this.ancientMap.panTo(city.position, { animate: true, duration: 0.5 });
    }
    
    // If terrain view, add elevation visualization
    if (this.terrainView && this.modernMap) {
      this.updateTerrainView();
    }
  }

  private updateMarkers() {
    // Update modern map markers only if map exists
    if (this.modernMap && this.markers) {
      Object.entries(this.markers).forEach(([id, marker]) => {
        const index = this.cities.findIndex(c => c.id === id);
        const icon = this.createCityIcon(index + 1, id, false);
        marker.setIcon(icon);
      });
    }
    
    // Update ancient map markers if exists
    if (this.ancientMap && this.ancientMarkers) {
      Object.entries(this.ancientMarkers).forEach(([id, marker]) => {
        const index = this.cities.findIndex(c => c.id === id);
        const icon = this.createCityIcon(index + 1, id, true);
        marker.setIcon(icon);
      });
    }
  }

  private updateTerrainView() {
    if (!this.modernMap) return;
    
    // Check if terrain layer already exists
    let hasTerrainLayer = false;
    this.modernMap.eachLayer((layer: any) => {
      if (layer._url && layer._url.includes('terrain')) {
        hasTerrainLayer = true;
      }
    });
    
    // Add terrain/elevation layer if not present
    if (!hasTerrainLayer) {
      L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg', {
        attribution: 'Map tiles by Stamen Design',
        opacity: 0.5
      }).addTo(this.modernMap);
    }
  }

  toggleJourneyPlayback() {
    if (this.isPlaying) {
      this.stopPlayback();
    } else {
      this.startPlayback();
    }
  }

  private startPlayback() {
    this.isPlaying = true;
    this.currentCityIndex = 0;
    this.selectCity(this.cities[0]);
    
    this.playbackInterval = interval(3000).subscribe(() => {
      if (this.currentCityIndex < this.cities.length - 1) {
        this.currentCityIndex++;
        this.selectCity(this.cities[this.currentCityIndex]);
      } else {
        this.stopPlayback();
      }
    });
  }

  private stopPlayback() {
    this.isPlaying = false;
    if (this.playbackInterval) {
      this.playbackInterval.unsubscribe();
    }
  }

  toggleTerrainView() {
    this.terrainView = !this.terrainView;
    
    if (!this.modernMap) return;
    
    if (this.terrainView) {
      // Add terrain visualization
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri',
        opacity: 0.6
      }).addTo(this.modernMap);
    } else {
      // Remove terrain layers
      this.modernMap.eachLayer((layer: any) => {
        if (layer._url && (layer._url.includes('terrain') || layer._url.includes('World_Physical_Map'))) {
          this.modernMap.removeLayer(layer);
        }
      });
    }
  }

  toggleSplitView() {
    this.splitView = !this.splitView;
    
    if (this.splitView) {
      // Initialize ancient map after DOM update
      setTimeout(() => {
        this.initializeAncientMap();
      }, 100);
    } else {
      // Clean up ancient map
      if (this.ancientMap) {
        this.ancientMap.remove();
        this.ancientMap = null;
        this.ancientMarkers = {};
      }
    }
    
    // Resize modern map
    setTimeout(() => {
      this.modernMap.invalidateSize();
    }, 300);
  }

  toggleMemorized(cityId: string) {
    if (this.memorized.has(cityId)) {
      this.memorized.delete(cityId);
    } else {
      this.memorized.add(cityId);
    }
    
    // Save progress
    localStorage.setItem('scripture-atlas-memorized', JSON.stringify(Array.from(this.memorized)));
    
    // Update markers
    this.updateMarkers();
  }

  markVersesAsRead() {
    if (this.selectedCity) {
      this.versesRead.add(this.selectedCity.id);
      localStorage.setItem('scripture-atlas-verses-read', JSON.stringify(Array.from(this.versesRead)));
    }
  }

  syncWithTracker() {
    // This would integrate with the Scripture Tracker component
    // For now, we'll just show an alert
    alert('Syncing with Scripture Tracker... This would update your reading progress in Acts 13-14!');
  }

  toggleScripture() {
    this.showScripture = !this.showScripture;
  }

  nextCity() {
    if (this.currentCityIndex < this.cities.length - 1) {
      this.selectCity(this.cities[this.currentCityIndex + 1]);
    } else {
      // Loop back to first city
      this.selectCity(this.cities[0]);
    }
  }

  showNextCity() {
    if (this.currentCityIndex < this.cities.length - 1) {
      this.selectCity(this.cities[this.currentCityIndex + 1]);
    } else {
      // Loop back to first city
      this.selectCity(this.cities[0]);
    }
  }

  onTimelineChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const index = parseInt(target.value);
    if (index >= 0 && index < this.cities.length) {
      this.selectCity(this.cities[index]);
    }
  }

  getProgressPercentage(): number {
    return Math.round((this.memorized.size / this.cities.length) * 100);
  }

  getCityIllustration(cityId: string): string {
    // Return custom illustrations for each city
    const illustrations: { [key: string]: string } = {
      'antioch-syria': 'assets/cities/antioch-syria.jpg',
      'seleucia': 'assets/cities/seleucia.jpg',
      'salamis': 'assets/cities/salamis.jpg',
      'paphos': 'assets/cities/paphos.jpg',
      'perga': 'assets/cities/perga.jpg',
      'pisidian-antioch': 'assets/cities/pisidian-antioch.jpg',
      'iconium': 'assets/cities/iconium.jpg',
      'lystra': 'assets/cities/lystra.jpg',
      'derbe': 'assets/cities/derbe.jpg'
    };
    
    // Fallback to generated gradient if no image
    return illustrations[cityId] || `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%236366f1;stop-opacity:1"/><stop offset="100%" style="stop-color:%23a78bfa;stop-opacity:1"/></linearGradient></defs><rect width="400" height="200" fill="url(%23g1)"/><text x="200" y="100" text-anchor="middle" fill="white" font-size="24" font-family="Arial">${this.selectedCity?.name || ''}</text></svg>`;
  }
}
