import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import OpenAI from 'openai';
import { DocumentChunk } from './entity/document-chunk.entity';
import { DocumentType } from './entity/document.entity';

@Injectable()
export class VectorService {
  private openai: OpenAI;

  constructor(
    private configService: ConfigService,
    @InjectRepository(DocumentChunk)
    private chunkRepository: Repository<DocumentChunk>,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  /**
   * 텍스트에 대한 임베딩을 생성합니다.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text.replace(/\n/g, ' '),
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('임베딩 생성 실패:', error);
      throw new Error('임베딩 생성에 실패했습니다.');
    }
  }

  /**
   * 유사한 문서 청크를 검색합니다. (pgvector 최적화 버전)
   */
  async searchSimilarChunks(
    organizationId: string,
    query: string,
    options: {
      documentTypes?: DocumentType[];
      limit?: number;
      threshold?: number;
    } = {},
  ): Promise<Array<{ chunk: DocumentChunk; score: number }>> {
    const { limit = 5, threshold = 0.7 } = options;

    try {
      // 1. 쿼리 임베딩 생성
      const queryEmbedding = await this.generateEmbedding(query);
      const embeddingString = `[${queryEmbedding.join(',')}]`;

      // 2. pgvector를 사용한 최적화된 벡터 검색
      let queryBuilder = this.chunkRepository
        .createQueryBuilder('chunk')
        .leftJoinAndSelect('chunk.document', 'document')
        .where('document.organizationId = :organizationId', { organizationId })
        .andWhere('document.status = :status', { status: 'active' })
        .andWhere('chunk.embedding IS NOT NULL');

      // 문서 타입 필터링
      if (options.documentTypes && options.documentTypes.length > 0) {
        queryBuilder = queryBuilder.andWhere('document.type IN (:...types)', {
          types: options.documentTypes,
        });
      }

      // 코사인 유사도를 사용한 벡터 검색 (pgvector)
      queryBuilder = queryBuilder
        .addSelect(
          `1 - (chunk.embedding <=> '${embeddingString}'::vector)`,
          'similarity',
        )
        .having('1 - (chunk.embedding <=> :embedding::vector) >= :threshold', {
          embedding: embeddingString,
          threshold,
        })
        .orderBy('chunk.embedding <=> :embedding::vector', 'ASC')
        .setParameter('embedding', embeddingString)
        .limit(limit);

      const rawResults = await queryBuilder.getRawAndEntities();

      // 3. 결과 매핑
      const results = rawResults.entities.map((chunk, index) => ({
        chunk,
        score: parseFloat(rawResults.raw[index].similarity),
      }));

      return results;
    } catch (error) {
      console.error('pgvector 검색 실패, 폴백 모드로 전환:', error);
      return this.fallbackSearch(organizationId, query, options);
    }
  }

  /**
   * pgvector 실패 시 폴백 검색 (기존 방식)
   */
  private async fallbackSearch(
    organizationId: string,
    query: string,
    options: {
      documentTypes?: DocumentType[];
      limit?: number;
      threshold?: number;
    } = {},
  ): Promise<Array<{ chunk: DocumentChunk; score: number }>> {
    const { limit = 5, threshold = 0.7 } = options;

    const queryEmbedding = await this.generateEmbedding(query);

    let queryBuilder = this.chunkRepository
      .createQueryBuilder('chunk')
      .leftJoinAndSelect('chunk.document', 'document')
      .where('document.organizationId = :organizationId', { organizationId })
      .andWhere('document.status = :status', { status: 'active' });

    if (options.documentTypes && options.documentTypes.length > 0) {
      queryBuilder = queryBuilder.andWhere('document.type IN (:...types)', {
        types: options.documentTypes,
      });
    }

    const chunks = await queryBuilder.getMany();

    const results = chunks
      .map((chunk) => {
        if (!chunk.embedding) return null;

        const score = this.calculateCosineSimilarity(
          queryEmbedding,
          chunk.embedding,
        );

        return { chunk, score };
      })
      .filter(
        (result): result is { chunk: DocumentChunk; score: number } =>
          result !== null && result.score >= threshold,
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return results;
  }

  /**
   * 코사인 유사도를 계산합니다.
   */
  calculateCosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('벡터 차원이 일치하지 않습니다.');
    }

    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * 문서 청크의 임베딩을 배치로 업데이트합니다.
   */
  async updateChunkEmbeddings(chunks: DocumentChunk[]): Promise<void> {
    const batchSize = 100; // OpenAI API 제한 고려
    console.log(`📊 임베딩 생성 시작: ${chunks.length}개 청크`);

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      console.log(`⚡ 배치 ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)} 처리 중...`);

      try {
        const embeddings = await Promise.all(
          batch.map((chunk) => this.generateEmbedding(chunk.content)),
        );

        // 배치로 저장 (성능 개선)
        const updates = batch.map((chunk, index) => {
          chunk.embedding = embeddings[index];
          return chunk;
        });

        await this.chunkRepository.save(updates);

        console.log(`✅ 배치 완료: ${batch.length}개 청크 임베딩 생성`);
      } catch (error) {
        console.error(`❌ 배치 ${Math.floor(i / batchSize) + 1} 실패:`, error);
        
        // 개별 처리로 폴백
        for (const chunk of batch) {
          try {
            chunk.embedding = await this.generateEmbedding(chunk.content);
            await this.chunkRepository.save(chunk);
          } catch (chunkError) {
            console.error(`청크 임베딩 실패 (ID: ${chunk.id}):`, chunkError);
          }
        }
      }

      // API 속도 제한 방지를 위한 지연
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(`🎉 임베딩 생성 완료: ${chunks.length}개 청크`);
  }

  /**
   * 임베딩 상태를 확인합니다.
   */
  async getEmbeddingStatus(organizationId: string): Promise<{
    totalChunks: number;
    embeddedChunks: number;
    pendingChunks: number;
    embeddingProgress: number;
  }> {
    const totalChunks = await this.chunkRepository
      .createQueryBuilder('chunk')
      .leftJoin('chunk.document', 'document')
      .where('document.organizationId = :organizationId', { organizationId })
      .andWhere('document.status = :status', { status: 'active' })
      .getCount();

    const embeddedChunks = await this.chunkRepository
      .createQueryBuilder('chunk')
      .leftJoin('chunk.document', 'document')
      .where('document.organizationId = :organizationId', { organizationId })
      .andWhere('document.status = :status', { status: 'active' })
      .andWhere('chunk.embedding IS NOT NULL')
      .getCount();

    const pendingChunks = totalChunks - embeddedChunks;
    const embeddingProgress = totalChunks > 0 ? (embeddedChunks / totalChunks) * 100 : 0;

    return {
      totalChunks,
      embeddedChunks,
      pendingChunks,
      embeddingProgress: Math.round(embeddingProgress * 100) / 100,
    };
  }

  /**
   * 임베딩이 누락된 청크를 재처리합니다.
   */
  async reprocessMissingEmbeddings(organizationId: string): Promise<void> {
    const chunksWithoutEmbedding = await this.chunkRepository
      .createQueryBuilder('chunk')
      .leftJoin('chunk.document', 'document')
      .where('document.organizationId = :organizationId', { organizationId })
      .andWhere('document.status = :status', { status: 'active' })
      .andWhere('chunk.embedding IS NULL')
      .getMany();

    if (chunksWithoutEmbedding.length > 0) {
      console.log(`🔄 누락된 임베딩 재처리: ${chunksWithoutEmbedding.length}개 청크`);
      await this.updateChunkEmbeddings(chunksWithoutEmbedding);
    }
  }
}
