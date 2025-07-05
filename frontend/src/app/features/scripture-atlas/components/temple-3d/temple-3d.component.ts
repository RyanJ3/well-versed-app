import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Input } from '@angular/core';
import * as THREE from 'three';

@Component({
  selector: 'app-temple-3d',
  standalone: true,
  template: '<div #templeContainer class="temple-container"></div>',
  styles: [`
    .temple-container {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: 10;
    }
  `]
})
export class Temple3DComponent implements OnInit, OnDestroy {
  @ViewChild('templeContainer', { static: true }) container!: ElementRef;
  @Input() visible: boolean = false;
  
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private temple!: THREE.Group;
  private animationId: number = 0;
  
  ngOnInit() {
    this.initThreeJS();
    this.createTemple();
    this.animate();
  }
  
  ngOnDestroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.renderer?.dispose();
  }
  
  private initThreeJS() {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0xf4e8d0, 100, 500);
    
    // Camera
    const aspect = this.container.nativeElement.offsetWidth / this.container.nativeElement.offsetHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(50, 30, 50);
    this.camera.lookAt(0, 0, 0);
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true 
    });
    this.renderer.setSize(
      this.container.nativeElement.offsetWidth,
      this.container.nativeElement.offsetHeight
    );
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.nativeElement.appendChild(this.renderer.domElement);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    this.scene.add(directionalLight);
  }
  
  private createTemple() {
    this.temple = new THREE.Group();
    
    // Materials
    const stoneMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xe8d4a0,
      specular: 0x222222,
      shininess: 10
    });
    
    const goldMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xFFD700,
      specular: 0xFFFFFF,
      shininess: 100,
      emissive: 0x332200,
      emissiveIntensity: 0.2
    });
    
    const bronzeMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xCD7F32,
      specular: 0x553311,
      shininess: 80
    });
    
    // Platform
    const platformGeometry = new THREE.BoxGeometry(35, 2, 50);
    const platform = new THREE.Mesh(platformGeometry, stoneMaterial);
    platform.position.y = -1;
    platform.receiveShadow = true;
    this.temple.add(platform);
    
    // Main temple structure (60x20x30 cubits)
    const mainHallGeometry = new THREE.BoxGeometry(20, 15, 30);
    const mainHall = new THREE.Mesh(mainHallGeometry, stoneMaterial);
    mainHall.position.set(0, 8.5, 0);
    mainHall.castShadow = true;
    mainHall.receiveShadow = true;
    this.temple.add(mainHall);
    
    // Porch (20x10 cubits)
    const porchGeometry = new THREE.BoxGeometry(10, 15, 5);
    const porch = new THREE.Mesh(porchGeometry, stoneMaterial);
    porch.position.set(0, 8.5, 17.5);
    porch.castShadow = true;
    this.temple.add(porch);
    
    // Holy of Holies (inner sanctuary - 20x20x20 cubits)
    const holyGeometry = new THREE.BoxGeometry(10, 10, 10);
    const holyOfHolies = new THREE.Mesh(holyGeometry, goldMaterial);
    holyOfHolies.position.set(0, 6, -10);
    this.temple.add(holyOfHolies);
    
    // Roof
    const roofGeometry = new THREE.BoxGeometry(22, 2, 32);
    const roof = new THREE.Mesh(roofGeometry, stoneMaterial);
    roof.position.set(0, 17, 0);
    roof.castShadow = true;
    this.temple.add(roof);
    
    // Pillars (Jachin and Boaz)
    const pillarGeometry = new THREE.CylinderGeometry(1.5, 1.5, 18, 16);
    const capitalGeometry = new THREE.SphereGeometry(2, 16, 8);
    
    // Left pillar (Jachin)
    const leftPillar = new THREE.Mesh(pillarGeometry, bronzeMaterial);
    leftPillar.position.set(-6, 9, 20);
    leftPillar.castShadow = true;
    this.temple.add(leftPillar);
    
    const leftCapital = new THREE.Mesh(capitalGeometry, bronzeMaterial);
    leftCapital.position.set(-6, 18.5, 20);
    this.temple.add(leftCapital);
    
    // Right pillar (Boaz)
    const rightPillar = new THREE.Mesh(pillarGeometry, bronzeMaterial);
    rightPillar.position.set(6, 9, 20);
    rightPillar.castShadow = true;
    this.temple.add(rightPillar);
    
    const rightCapital = new THREE.Mesh(capitalGeometry, bronzeMaterial);
    rightCapital.position.set(6, 18.5, 20);
    this.temple.add(rightCapital);
    
    // Side chambers (3 stories)
    for (let i = 0; i < 3; i++) {
      const chamberGeometry = new THREE.BoxGeometry(3, 4, 28);
      
      const leftChamber = new THREE.Mesh(chamberGeometry, stoneMaterial);
      leftChamber.position.set(-11.5, 3 + i * 4.5, 0);
      leftChamber.castShadow = true;
      this.temple.add(leftChamber);
      
      const rightChamber = new THREE.Mesh(chamberGeometry, stoneMaterial);
      rightChamber.position.set(11.5, 3 + i * 4.5, 0);
      rightChamber.castShadow = true;
      this.temple.add(rightChamber);
    }
    
    // Bronze Sea (large basin)
    const seaGeometry = new THREE.CylinderGeometry(5, 4, 3, 32);
    const bronzeSea = new THREE.Mesh(seaGeometry, bronzeMaterial);
    bronzeSea.position.set(12, 2.5, 15);
    bronzeSea.castShadow = true;
    this.temple.add(bronzeSea);
    
    // Courtyard walls
    const wallMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xccaa88,
      opacity: 0.8,
      transparent: true
    });
    
    // Front wall segments
    const wallHeight = 6;
    const wallThickness = 0.5;
    
    const leftWallGeometry = new THREE.BoxGeometry(12, wallHeight, wallThickness);
    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    leftWall.position.set(-11.5, 3, 25);
    this.temple.add(leftWall);
    
    const rightWallGeometry = new THREE.BoxGeometry(12, wallHeight, wallThickness);
    const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
    rightWall.position.set(11.5, 3, 25);
    this.temple.add(rightWall);
    
    this.scene.add(this.temple);
  }
  
  private animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    
    if (this.visible && this.temple) {
      // Gentle rotation
      this.temple.rotation.y += 0.002;
      
      // Floating effect
      this.temple.position.y = Math.sin(Date.now() * 0.001) * 0.5;
    }
    
    this.renderer.render(this.scene, this.camera);
  }
  
  setVisibility(visible: boolean) {
    this.visible = visible;
    this.temple.visible = visible;
  }
  
  onResize() {
    const width = this.container.nativeElement.offsetWidth;
    const height = this.container.nativeElement.offsetHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}
