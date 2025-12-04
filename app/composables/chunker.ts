import { InstancedMesh, Vector2 } from "three";

export type Chunk = {
    points: Array<Array<number | undefined>>,
    mesh?: InstancedMesh
}
  
export class Chunker {
    /**
     * @param units - The number of units in the chunk
     * @param chunks - The chunk list
     */
    
    units: number = 64;
    private chunks: Map<String, Chunk> = new Map();
  
    constructor(units: number) {
      this.units = units;
    }
  
    positionToKey(chunkPosition: Vector2): String {
      /**
       * @param chunkPosition - The position of the chunk
       * @returns The key of the chunk
       */

      return `${chunkPosition.x},${chunkPosition.y}`;
    }
    keyToPosition(key: String): Vector2 | undefined {
      /**
       * @param key - The key of the chunk
       * @returns The position of the chunk
       */
      
      const [x, y] = key.split(',').map(Number);
      // Guard only against invalid numbers (NaN), not valid 0 coordinates
      if (Number.isNaN(x) || Number.isNaN(y)) return undefined;
      return new Vector2(x, y);
    }
  
    translatePositionToChunk(position: Vector2): [Vector2, Vector2] {
      /**
       * @param position - The position of the point
       * @returns The chunk position and the local position
       */

      return [
        new Vector2(Math.floor(position.x / this.units), Math.floor(position.y / this.units)),
        new Vector2(Math.floor(position.x % this.units - 1), Math.floor(position.y % this.units - 1))
      ];
    }
  
    translateChunkToPositions(chunkPosition: Vector2): [Vector2, Vector2] {
      /**
       * @param chunkPosition - The position of the chunk
       * @returns The start and end positions of the chunk
       */
      
      return [
        new Vector2(chunkPosition.x * this.units, chunkPosition.y * this.units),
        new Vector2(chunkPosition.x * this.units + this.units - 1, chunkPosition.y * this.units + this.units - 1)
      ];
    }
  
    private createChunk(chunkPosition: Vector2) {
      /**
       * @param chunkPosition - The position of the chunk
       * @returns The chunk, created if it doesn't exist
       */
      
      if (!this.ifChunkExists(chunkPosition)) {
        const chunk: Chunk = { points: Array.from({ length: this.units }, () => Array.from({ length: this.units }, () => undefined)) };
        this.chunks.set(this.positionToKey(chunkPosition), chunk);
      }
    }
  
    ifChunkExists(chunkPosition: Vector2) {
      /**
       * @param chunkPosition - The position of the chunk
       * @returns True if the chunk exists, false otherwise
       */
      
      return this.chunks.has(this.positionToKey(chunkPosition));
    }
  
    getChunk(chunkPosition: Vector2) {
      /**
       * @param chunkPosition - The position of the chunk
       * @returns The chunk
       */
      
      return this.chunks.get(this.positionToKey(chunkPosition));
    }
  
    getChunks() {
      /**
       * @returns The chunk list
       */
      
      return this.chunks;
    }
  
    setChunk(chunkPosition: Vector2, chunk: Chunk) {
      /**
       * @param chunkPosition - The position of the chunk
       * @param chunk - The chunk to set
       */
      
      this.chunks.set(this.positionToKey(chunkPosition), chunk);
    }
  
    setPoint(position: Vector2, value: number) {
      /**
       * @param position - The position of the point
       * @param value - The value to set
       */
      
      const [chunkPosition, localPosition] = this.translatePositionToChunk(position);
  
      this.createChunk(chunkPosition);
  
      const chunk = this.getChunk(chunkPosition);
      if (!chunk) return;
      const row = chunk.points[localPosition.x];
      if (!row) return;
  
      row[localPosition.y] = value;
    }
  
    getPoint(position: Vector2) {
      /**
       * @param position - The position of the point
       * @returns The value of the point
       */
      
      const [chunkPosition, localPosition] = this.translatePositionToChunk(position);
  
      this.ifChunkExists(chunkPosition);
  
      return this.getChunk(chunkPosition)?.points[localPosition.x]?.[localPosition.y];
    }
  }