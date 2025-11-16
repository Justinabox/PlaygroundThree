import { InstancedMesh, Vector2 } from "three";

export type Chunk = {
    points: Array<Array<number | undefined>>,
    mesh?: InstancedMesh
}
  
export class Chunker {
    units: number = 64;
    private chunks: Map<String, Chunk> = new Map();
  
    constructor(units: number) {
      this.units = units;
    }
  
    positionToKey(chunkPosition: Vector2): String {
      return `${chunkPosition.x},${chunkPosition.y}`;
    }
    keyToPosition(key: String): Vector2 | undefined {
      const [x, y] = key.split(',').map(Number);
      // Guard only against invalid numbers (NaN), not valid 0 coordinates
      if (Number.isNaN(x) || Number.isNaN(y)) return undefined;
      return new Vector2(x, y);
    }
  
    translatePositionToChunk(position: Vector2): [Vector2, Vector2] {
      // return the chunk position and the local position
      return [
        new Vector2(Math.floor(position.x / this.units), Math.floor(position.y / this.units)),
        new Vector2(Math.floor(position.x % this.units - 1), Math.floor(position.y % this.units - 1))
      ];
    }
  
    translateChunkToPositions(chunkPosition: Vector2): [Vector2, Vector2] {
      return [
        new Vector2(chunkPosition.x * this.units, chunkPosition.y * this.units),
        new Vector2(chunkPosition.x * this.units + this.units - 1, chunkPosition.y * this.units + this.units - 1)
      ];
    }
  
    private createChunk(chunkPosition: Vector2) {
      // create an empty chunk
      if (!this.ifChunkExists(chunkPosition)) {
        const chunk: Chunk = { points: Array.from({ length: this.units }, () => Array.from({ length: this.units }, () => undefined)) };
        this.chunks.set(this.positionToKey(chunkPosition), chunk);
      }
    }
  
    ifChunkExists(chunkPosition: Vector2) {
      return this.chunks.has(this.positionToKey(chunkPosition));
    }
  
    getChunk(chunkPosition: Vector2) {
      return this.chunks.get(this.positionToKey(chunkPosition));
    }
  
    getChunks() {
      return this.chunks;
    }
  
    setChunk(chunkPosition: Vector2, chunk: Chunk) {
      this.chunks.set(this.positionToKey(chunkPosition), chunk);
    }
  
    setPoint(position: Vector2, value: number) {
      const [chunkPosition, localPosition] = this.translatePositionToChunk(position);
  
      this.createChunk(chunkPosition);
  
      const chunk = this.getChunk(chunkPosition);
      if (!chunk) return;
      const row = chunk.points[localPosition.x];
      if (!row) return;
  
      row[localPosition.y] = value;
    }
  
    getPoint(position: Vector2) {
      const [chunkPosition, localPosition] = this.translatePositionToChunk(position);
  
      this.ifChunkExists(chunkPosition);
  
      return this.getChunk(chunkPosition)?.points[localPosition.x]?.[localPosition.y];
    }
  }