import { getCaseHistory, saveOrUpdateCase } from '../../services/firestoreService';
import { createPrefix, savePrefix } from '../../services/prefixService';
import { initializeDefaultConcepts, getConcepts } from '../../services/conceptService';
import { CaseRecord, FileCategory, PrefixLine, ConceptCatalog } from '@/types';

/**
 * Migration script to convert from category-based to prefix-based system
 * 
 * This script:
 * 1. Creates default prefixes for existing categories (GE-MAT, FI-TRI, FI-CONTA)
 * 2. Initializes default concept catalog
 * 3. Migrates existing cases to use prefixId
 * 4. Converts economic lines to include type and conceptId
 */

// Default prefix configurations
const DEFAULT_PREFIXES: Array<{ code: string; description: string; category: FileCategory }> = [
    { code: 'GMAT', description: 'Gestión de Matriculaciones y Tráfico', category: 'GE-MAT' },
    { code: 'FITRI', description: 'Fiscal Trimestral', category: 'FI-TRI' },
    { code: 'FICONTA', description: 'Contabilidad Financiera', category: 'FI-CONTA' }
];

/**
 * Create default prefixes with sample economic lines
 */
async function createDefaultPrefixes(concepts: ConceptCatalog[]): Promise<Map<FileCategory, string>> {
    const categoryToPrefixId = new Map<FileCategory, string>();

    for (const prefixDef of DEFAULT_PREFIXES) {
        console.log(`Creating prefix: ${prefixDef.code}...`);

        // Create prefix object
        const prefixId = `prefix_${Date.now()}_${prefixDef.code}`;
        const newPrefix = {
            id: prefixId,
            code: prefixDef.code,
            description: prefixDef.description,
            isActive: true,
            lines: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await createPrefix(newPrefix);
        categoryToPrefixId.set(prefixDef.category, prefixId);

        // Add default lines based on category
        const lines: PrefixLine[] = [];

        if (prefixDef.category === 'GE-MAT') {
            // GE-MAT specific lines
            const gestoriaConcept = concepts.find(c => c.name === 'Honorarios Gestoría');
            const tasasConcept = concepts.find(c => c.name === 'Tasas DGT');
            const impuestoConcept = concepts.find(c => c.name === 'Impuesto de Matriculación');

            if (gestoriaConcept) {
                lines.push({
                    id: `line_${Date.now()}_1`,
                    order: 1,
                    type: 'honorario',
                    conceptId: gestoriaConcept.id,
                    conceptName: gestoriaConcept.name,
                    defaultAmount: 150,
                    isIncluded: true
                });
            }

            if (tasasConcept) {
                lines.push({
                    id: `line_${Date.now()}_2`,
                    order: 2,
                    type: 'suplido',
                    conceptId: tasasConcept.id,
                    conceptName: tasasConcept.name,
                    defaultAmount: 95.20,
                    isIncluded: true
                });
            }

            if (impuestoConcept) {
                lines.push({
                    id: `line_${Date.now()}_3`,
                    order: 3,
                    type: 'suplido',
                    conceptId: impuestoConcept.id,
                    conceptName: impuestoConcept.name,
                    defaultAmount: 0,
                    isIncluded: false
                });
            }
        } else {
            // Generic lines for other categories
            const honorariosConcept = concepts.find(c => c.name === 'Honorarios Tramitación');
            if (honorariosConcept) {
                lines.push({
                    id: `line_${Date.now()}_1`,
                    order: 1,
                    type: 'honorario',
                    conceptId: honorariosConcept.id,
                    conceptName: honorariosConcept.name,
                    defaultAmount: 100,
                    isIncluded: true
                });
            }
        }

        // Update prefix with lines
        await savePrefix({
            ...newPrefix,
            lines
        });

        console.log(`✓ Created prefix ${prefixDef.code} with ${lines.length} lines`);
    }

    return categoryToPrefixId;
}

/**
 * Migrate existing cases to use prefixId
 */
async function migrateCases(categoryToPrefixId: Map<FileCategory, string>, concepts: ConceptCatalog[]): Promise<void> {
    console.log('Migrating existing cases...');

    const cases = await getCaseHistory();
    let migratedCount = 0;

    for (const caseRecord of cases) {
        // Skip if already migrated
        if (caseRecord.prefixId) {
            continue;
        }

        // Get prefix ID from category
        const category = caseRecord.fileConfig.category;
        const prefixId = categoryToPrefixId.get(category);

        if (!prefixId) {
            console.warn(`No prefix found for category ${category}, skipping case ${caseRecord.fileNumber}`);
            continue;
        }

        // Migrate economic lines to include type and conceptId
        const migratedLines = caseRecord.economicData.lines.map((line: any) => {
            // Try to find matching concept by name
            const matchingConcept = concepts.find(c =>
                c.name.toLowerCase() === line.concept.toLowerCase()
            );

            return {
                ...line,
                conceptId: matchingConcept?.id || `concept_unknown_${Date.now()}`,
                type: matchingConcept?.category || 'honorario' as const
            };
        });

        // Update case with prefixId and migrated economic lines
        const updatedCase: CaseRecord = {
            ...caseRecord,
            prefixId,
            economicData: {
                ...caseRecord.economicData,
                lines: migratedLines
            }
        };

        await saveOrUpdateCase(updatedCase);
        migratedCount++;
    }

    console.log(`✓ Migrated ${migratedCount} cases`);
}

/**
 * Main migration function
 */
export async function migrateToPrefix(): Promise<void> {
    try {
        console.log('=== Starting migration to prefix-based system ===');

        // Step 1: Initialize default concepts
        console.log('Step 1: Initializing concept catalog...');
        await initializeDefaultConcepts();
        const concepts = await getConcepts();
        console.log(`✓ Initialized ${concepts.length} concepts`);

        // Step 2: Create default prefixes
        console.log('Step 2: Creating default prefixes...');
        const categoryToPrefixId = await createDefaultPrefixes(concepts);
        console.log(`✓ Created ${categoryToPrefixId.size} prefixes`);

        // Step 3: Migrate existing cases
        console.log('Step 3: Migrating existing cases...');
        await migrateCases(categoryToPrefixId, concepts);

        console.log('=== Migration completed successfully ===');
    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    }
}

/**
 * Check if migration is needed
 */
export async function isMigrationNeeded(): Promise<boolean> {
    try {
        const cases = await getCaseHistory();
        // If any case doesn't have prefixId, migration is needed
        return cases.some((c: any) => !c.prefixId);
    } catch (error) {
        console.error('Error checking migration status:', error);
        return false;
    }
}
