import { BoxGeometry, Vector2, MeshStandardMaterial, Vector3, Color, Matrix4, InstancedMesh } from "three";
import { Chunker, type Chunk } from "./chunker";
import { createNoise2D } from 'simplex-noise';
import { type TresScene } from '@tresjs/core'
import alea from 'alea';

export class NoiseMap {
    private noiseFunction: (x: number, y: number) => number;
    // private position: Vector2 = new Vector2(0, 0);
    private segments: number = 32;
    private scale: number = 0.2;
    private center: Vector2 = new Vector2(0, 0);
    private range: number = 15;
    private chunker: Chunker = new Chunker(128);
    private scene: Ref<TresScene>;
    private meshCount: number = 0;
  
    private box = new BoxGeometry(1 / this.segments, 1 / this.segments, 1 / this.segments);
    private material = new MeshStandardMaterial({ color: 'white' });
  
    constructor(seed: string, scene: Ref<TresScene>) {
      this.noiseFunction = createNoise2D(alea(seed));
      this.scene = scene;
    }
  
    trimChunks() {
      const { startChunk, endChunk } = this.getChunkBounds();
  
      this.chunker.getChunks().forEach((chunk, chunkPosition) => {
        const position = this.chunker.keyToPosition(chunkPosition);
        if (!position) return;
        if (position.x < startChunk.x || position.x > endChunk.x || position.y < startChunk.y || position.y > endChunk.y) {
          console.log('removing chunk', position.x, position.y);
          if (chunk.mesh) this.scene.value.remove(chunk.mesh);
          this.chunker.getChunks().delete(chunkPosition);
        }
      });
    }
  
    getChunkBounds() {
      const start = new Vector2((-this.range + this.center.x) * this.segments, (-this.range + this.center.y) * this.segments);
      const end = new Vector2((this.range + this.center.x) * this.segments, (this.range + this.center.y) * this.segments);
      // console.log(start, end);
  
      const [startChunk] = this.chunker.translatePositionToChunk(start);
      const [endChunk] = this.chunker.translatePositionToChunk(end);
  
      return { startChunk, endChunk };
    }
  
    refreshChunks() {
      const { startChunk, endChunk } = this.getChunkBounds();
  
      for (let x = startChunk.x; x <= endChunk.x; x++) {
        for (let y = startChunk.y; y <= endChunk.y; y++) {
          const chunkPosition = new Vector2(x, y);
          if (this.chunker.ifChunkExists(chunkPosition)) continue;
          console.log('generating chunk', x, y);
          this.generateChunk(chunkPosition);
        }
      }
  
      this.trimChunks();
    }
  
    updateCenter(center: Vector2) {
      this.center = center;
      this.refreshChunks();
    }
  
    private getNoiseLevel(noise: number): number | undefined {
      if (noise > 0.87 && noise < 0.9) {
        return 2;
      } else if (noise > 0.77 && noise < 0.8) {
        return 1.5;
      } else if (noise > 0.57 && noise < 0.6) {
        return 1;
      } else if (noise > 0.37 && noise < 0.4) {
        return 0.5;
      } else if (noise > 0.17 && noise < 0.2) {
        return 0;
      } else {
        return undefined;
      }
    }
  
    generateChunk(chunkPosition: Vector2) {
      const [start, end] = this.chunker.translateChunkToPositions(chunkPosition);
  
      const chunk: Chunk = {points: Array(Array())}
      const instanceData: { position: Vector3; color: Color }[] = [];
  
      // generate noise
      for (let x = start.x; x <= end.x; x++) {
        const row = Array()
        for (let y = start.y; y <= end.y; y++) {
          const position = new Vector2(x, y);
          const noise = (this.noiseFunction(position.x / this.segments * this.scale, position.y / this.segments * this.scale) + 1) / 2;
          row.push(noise);
  
          // build instance data
          const level = this.getNoiseLevel(noise);
          if (level === undefined) continue;
          instanceData.push({ position: new Vector3(position.x / this.segments, level, position.y / this.segments), color: new Color(noise, noise, noise) });
        }
        chunk.points.push(row);
      }
  
      // build instance mesh
      const instanceMesh = new InstancedMesh(this.box, this.material, instanceData.length || 0);
      instanceData.forEach((data, index) => {
        instanceMesh.setMatrixAt(index, new Matrix4().makeTranslation(data.position.x, data.position.y, data.position.z));
        instanceMesh.setColorAt(index, data.color);
      });
      instanceMesh.instanceMatrix.needsUpdate = true;
      if (instanceMesh.instanceColor) instanceMesh.instanceColor.needsUpdate = true;
  
      chunk.mesh = instanceMesh;
  
      this.chunker.setChunk(chunkPosition, chunk);
      this.scene.value.add(instanceMesh);
    }
  }