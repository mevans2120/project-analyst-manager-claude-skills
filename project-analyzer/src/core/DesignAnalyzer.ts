/**
 * Design Analyzer
 * Analyzes design files, moodboards, wireframes, and screenshots to extract feature lists
 * Uses Claude's vision capabilities for image analysis
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';
import {
  ExtractedFeature,
  FeatureAnalysisResult,
  DesignAnalysisOptions,
  DesignContext,
  FeatureSource,
  FeatureCategory,
  ColorScheme,
  Typography,
  DetailedAnalysisResult
} from '../types/features';

export class DesignAnalyzer {
  private options: DesignAnalysisOptions;
  private context?: DesignContext;

  constructor(options: DesignAnalysisOptions, context?: DesignContext) {
    this.options = {
      includeLowConfidence: false,
      autoCategorize: true,
      extractColors: false,
      extractTypography: false,
      ...options
    };
    this.context = context;
  }

  /**
   * Analyze all configured design sources
   */
  async analyze(): Promise<DetailedAnalysisResult> {
    const startTime = performance.now();
    const features: ExtractedFeature[] = [];
    const analyzedSources: string[] = [];
    const warnings: string[] = [];

    // Analyze design files
    if (this.options.designFiles && this.options.designFiles.length > 0) {
      for (const file of this.options.designFiles) {
        try {
          const fileFeatures = await this.analyzeDesignFile(file);
          features.push(...fileFeatures);
          analyzedSources.push(file);
        } catch (error) {
          warnings.push(`Failed to analyze design file ${file}: ${error}`);
        }
      }
    }

    // Analyze moodboards
    if (this.options.moodboards && this.options.moodboards.length > 0) {
      for (const moodboard of this.options.moodboards) {
        try {
          const moodboardFeatures = await this.analyzeMoodboard(moodboard);
          features.push(...moodboardFeatures);
          analyzedSources.push(moodboard);
        } catch (error) {
          warnings.push(`Failed to analyze moodboard ${moodboard}: ${error}`);
        }
      }
    }

    // Analyze wireframes
    if (this.options.wireframes && this.options.wireframes.length > 0) {
      for (const wireframe of this.options.wireframes) {
        try {
          const wireframeFeatures = await this.analyzeWireframe(wireframe);
          features.push(...wireframeFeatures);
          analyzedSources.push(wireframe);
        } catch (error) {
          warnings.push(`Failed to analyze wireframe ${wireframe}: ${error}`);
        }
      }
    }

    // Analyze screenshots
    if (this.options.screenshots && this.options.screenshots.length > 0) {
      for (const screenshot of this.options.screenshots) {
        try {
          const screenshotFeatures = await this.analyzeScreenshot(screenshot);
          features.push(...screenshotFeatures);
          analyzedSources.push(screenshot);
        } catch (error) {
          warnings.push(`Failed to analyze screenshot ${screenshot}: ${error}`);
        }
      }
    }

    // Filter low confidence if needed
    const filteredFeatures = this.options.includeLowConfidence
      ? features
      : features.filter(f => f.confidence >= 70);

    // Deduplicate features
    const uniqueFeatures = this.deduplicateFeatures(filteredFeatures);

    // Calculate summary
    const summary = this.calculateSummary(uniqueFeatures);

    // Extract additional design information if requested
    const colorScheme = this.options.extractColors
      ? await this.extractColorScheme(analyzedSources)
      : undefined;

    const typography = this.options.extractTypography
      ? await this.extractTypography(analyzedSources)
      : undefined;

    const duration = performance.now() - startTime;

    const result: DetailedAnalysisResult = {
      features: uniqueFeatures,
      summary,
      metadata: {
        analyzedSources,
        analysisDate: new Date().toISOString(),
        analysisDuration: Math.round(duration),
        tool: 'DesignAnalyzer',
        version: '1.0.0'
      },
      warnings: warnings.length > 0 ? warnings : undefined,
      recommendations: this.generateRecommendations(uniqueFeatures),
      colorScheme,
      typography
    };

    return result;
  }

  /**
   * Analyze a design file (Figma export, Sketch, etc.)
   */
  private async analyzeDesignFile(filePath: string): Promise<ExtractedFeature[]> {
    const imageData = await this.loadImageAsBase64(filePath);

    const prompt = this.buildAnalysisPrompt(
      'design-file',
      filePath,
      'This is a design file showing UI components and layouts. Identify all distinct features, pages, and components.'
    );

    const features = await this.analyzeImageWithClaude(imageData, prompt, 'design-file', filePath);
    return features;
  }

  /**
   * Analyze a moodboard
   */
  private async analyzeMoodboard(filePath: string): Promise<ExtractedFeature[]> {
    const imageData = await this.loadImageAsBase64(filePath);

    const prompt = this.buildAnalysisPrompt(
      'moodboard',
      filePath,
      'This is a moodboard showing design inspiration, visual style, and UI patterns. Identify the key features and design patterns suggested.'
    );

    const features = await this.analyzeImageWithClaude(imageData, prompt, 'moodboard', filePath);
    return features;
  }

  /**
   * Analyze a wireframe
   */
  private async analyzeWireframe(filePath: string): Promise<ExtractedFeature[]> {
    const imageData = await this.loadImageAsBase64(filePath);

    const prompt = this.buildAnalysisPrompt(
      'wireframe',
      filePath,
      'This is a wireframe showing the structure and layout of a page or feature. Identify all UI elements, components, and functionality.'
    );

    const features = await this.analyzeImageWithClaude(imageData, prompt, 'wireframe', filePath);
    return features;
  }

  /**
   * Analyze a screenshot
   */
  private async analyzeScreenshot(filePath: string): Promise<ExtractedFeature[]> {
    const imageData = await this.loadImageAsBase64(filePath);

    const prompt = this.buildAnalysisPrompt(
      'screenshot',
      filePath,
      'This is a screenshot of an application. Identify all visible features, UI components, and functionality.'
    );

    const features = await this.analyzeImageWithClaude(imageData, prompt, 'screenshot', filePath);
    return features;
  }

  /**
   * Build analysis prompt with context
   */
  private buildAnalysisPrompt(sourceType: FeatureSource, sourcePath: string, basePrompt: string): string {
    let prompt = basePrompt + '\n\n';

    if (this.context) {
      if (this.context.projectName) {
        prompt += `Project: ${this.context.projectName}\n`;
      }
      if (this.context.platform) {
        prompt += `Platform: ${this.context.platform}\n`;
      }
      if (this.context.domain) {
        prompt += `Domain: ${this.context.domain}\n`;
      }
      if (this.options.projectContext) {
        prompt += `Context: ${this.options.projectContext}\n`;
      }
      prompt += '\n';
    }

    prompt += `For each feature you identify, provide:
1. Feature name (concise, descriptive)
2. Detailed description
3. Category (UI Component, Page, Navigation, Form, Data Display, Action, Content, Layout, or Other)
4. Priority (high, medium, or low)
5. Confidence score (0-100) - how certain you are this is a distinct feature
6. Any relevant notes or observations

Format your response as a JSON array of features with this structure:
[
  {
    "name": "Feature name",
    "description": "Detailed description",
    "category": "UI Component",
    "priority": "medium",
    "confidence": 85,
    "notes": "Optional notes"
  }
]

Be thorough but avoid duplicates. Group related elements into coherent features.`;

    return prompt;
  }

  /**
   * Analyze image using Claude's vision API
   * NOTE: This is a placeholder that would use Claude API with vision
   * In a real implementation, this would make an API call to Claude
   */
  private async analyzeImageWithClaude(
    imageData: string,
    prompt: string,
    source: FeatureSource,
    sourcePath: string
  ): Promise<ExtractedFeature[]> {
    // TODO: Implement actual Claude API call with vision
    // For now, return a placeholder structure

    console.log(`Analyzing ${sourcePath} with Claude vision...`);
    console.log(`Prompt: ${prompt.substring(0, 100)}...`);

    // Placeholder: In real implementation, this would be the Claude API response
    // const response = await callClaudeVisionAPI(imageData, prompt);
    // const parsedFeatures = JSON.parse(response);

    // For now, return empty array with a note
    // The actual implementation would parse Claude's JSON response
    const features: ExtractedFeature[] = [];

    return features.map((f: any) => this.normalizeFeature(f, source, sourcePath));
  }

  /**
   * Normalize a feature from Claude's response
   */
  private normalizeFeature(rawFeature: any, source: FeatureSource, sourcePath: string): ExtractedFeature {
    const id = this.generateFeatureId(rawFeature.name, sourcePath);

    return {
      id,
      name: rawFeature.name,
      description: rawFeature.description,
      category: this.mapCategory(rawFeature.category),
      source,
      sourcePath,
      priority: rawFeature.priority || 'medium',
      status: 'identified',
      confidence: rawFeature.confidence || 70,
      notes: rawFeature.notes,
      tags: this.extractTags(rawFeature.description),
      extractedAt: new Date().toISOString()
    };
  }

  /**
   * Load image file as base64
   */
  private async loadImageAsBase64(filePath: string): Promise<string> {
    const buffer = await fs.readFile(filePath);
    return buffer.toString('base64');
  }

  /**
   * Generate unique feature ID
   */
  private generateFeatureId(name: string, sourcePath: string): string {
    const hash = createHash('md5')
      .update(name + sourcePath)
      .digest('hex')
      .substring(0, 8);
    return `feat-${hash}`;
  }

  /**
   * Map category string to FeatureCategory type
   */
  private mapCategory(category: string): FeatureCategory {
    const categoryMap: Record<string, FeatureCategory> = {
      'ui component': 'UI Component',
      'page': 'Page',
      'navigation': 'Navigation',
      'form': 'Form',
      'data display': 'Data Display',
      'action': 'Action',
      'content': 'Content',
      'layout': 'Layout'
    };

    return categoryMap[category.toLowerCase()] || 'Other';
  }

  /**
   * Extract tags from description
   */
  private extractTags(description: string): string[] {
    const tags: string[] = [];

    // Common patterns
    if (description.toLowerCase().includes('button')) tags.push('button');
    if (description.toLowerCase().includes('form')) tags.push('form');
    if (description.toLowerCase().includes('table')) tags.push('table');
    if (description.toLowerCase().includes('chart')) tags.push('chart');
    if (description.toLowerCase().includes('modal')) tags.push('modal');
    if (description.toLowerCase().includes('dropdown')) tags.push('dropdown');
    if (description.toLowerCase().includes('menu')) tags.push('menu');
    if (description.toLowerCase().includes('search')) tags.push('search');

    return tags;
  }

  /**
   * Deduplicate features based on similarity
   */
  private deduplicateFeatures(features: ExtractedFeature[]): ExtractedFeature[] {
    const unique: ExtractedFeature[] = [];
    const seen = new Set<string>();

    for (const feature of features) {
      // Create a simple signature
      const signature = `${feature.name.toLowerCase()}-${feature.category}`;

      if (!seen.has(signature)) {
        seen.add(signature);
        unique.push(feature);
      } else {
        // Mark as duplicate
        const existing = unique.find(f =>
          f.name.toLowerCase() === feature.name.toLowerCase() &&
          f.category === feature.category
        );
        if (existing && !existing.relatedTo) {
          existing.relatedTo = [];
        }
        if (existing) {
          existing.relatedTo?.push(feature.id);
        }
      }
    }

    return unique;
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(features: ExtractedFeature[]): FeatureAnalysisResult['summary'] {
    const byCategory = {} as Record<FeatureCategory, number>;
    const bySource = {} as Record<FeatureSource, number>;
    const byPriority = { high: 0, medium: 0, low: 0, unassigned: 0 };
    let totalConfidence = 0;

    for (const feature of features) {
      // By category
      byCategory[feature.category] = (byCategory[feature.category] || 0) + 1;

      // By source
      bySource[feature.source] = (bySource[feature.source] || 0) + 1;

      // By priority
      if (feature.priority) {
        byPriority[feature.priority]++;
      } else {
        byPriority.unassigned++;
      }

      // Confidence
      totalConfidence += feature.confidence;
    }

    return {
      totalFeatures: features.length,
      byCategory,
      bySource,
      byPriority,
      averageConfidence: features.length > 0 ? Math.round(totalConfidence / features.length) : 0
    };
  }

  /**
   * Extract color scheme from design files
   * Placeholder for future implementation
   */
  private async extractColorScheme(sources: string[]): Promise<ColorScheme | undefined> {
    // TODO: Implement color extraction using image analysis
    return undefined;
  }

  /**
   * Extract typography from design files
   * Placeholder for future implementation
   */
  private async extractTypography(sources: string[]): Promise<Typography | undefined> {
    // TODO: Implement typography extraction
    return undefined;
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(features: ExtractedFeature[]): string[] {
    const recommendations: string[] = [];

    // Check for low confidence features
    const lowConfidence = features.filter(f => f.confidence < 70);
    if (lowConfidence.length > 0) {
      recommendations.push(
        `${lowConfidence.length} features have low confidence scores. Consider reviewing these manually or providing additional context.`
      );
    }

    // Check for category distribution
    const formFeatures = features.filter(f => f.category === 'Form');
    if (formFeatures.length > 5) {
      recommendations.push(
        `Detected ${formFeatures.length} form-related features. Consider creating a form component library.`
      );
    }

    // Check for navigation complexity
    const navFeatures = features.filter(f => f.category === 'Navigation');
    if (navFeatures.length > 10) {
      recommendations.push(
        `Complex navigation detected (${navFeatures.length} nav elements). Consider implementing a hierarchical navigation system.`
      );
    }

    return recommendations;
  }
}
