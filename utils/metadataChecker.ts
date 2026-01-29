import * as fs from "fs";
import * as path from "path";

const basePath = process.cwd();
const buildDir = `${basePath}/build`;
const jsonDir = `${buildDir}/json`;

interface Attribute {
    trait_type: string;
    value: string;
}

interface Metadata {
    name: string;
    description: string;
    image: string;
    dna: string;
    edition: number;
    date: number;
    attributes: Attribute[];
    compiler: string;
}

interface DuplicateGroup {
    attributeKey: string;
    files: string[];
}

/**
 * Creates a unique key from attributes array for comparison
 * Sorts attributes by trait_type to ensure consistent comparison
 */
const createAttributeKey = (attributes: Attribute[]): string => {
    const sorted = [...attributes].sort((a, b) =>
        a.trait_type.localeCompare(b.trait_type)
    );
    return JSON.stringify(sorted);
};

/**
 * Checks all JSON files in build/json for duplicate attributes
 * Returns an array of duplicate groups
 */
const findDuplicateAttributes = (): DuplicateGroup[] => {
    // Get all JSON files except _metadata.json
    const files = fs
        .readdirSync(jsonDir)
        .filter((file) => file.endsWith(".json") && file !== "_metadata.json");

    // Map to store attribute keys and their corresponding files
    const attributeMap = new Map<string, string[]>();

    console.log(`\n🔍 Checking ${files.length} JSON files for duplicates...\n`);

    for (const file of files) {
        const filePath = path.join(jsonDir, file);
        try {
            const content = fs.readFileSync(filePath, "utf-8");
            const metadata: Metadata = JSON.parse(content);

            if (metadata.attributes && Array.isArray(metadata.attributes)) {
                const key = createAttributeKey(metadata.attributes);

                if (attributeMap.has(key)) {
                    attributeMap.get(key)!.push(file);
                } else {
                    attributeMap.set(key, [file]);
                }
            }
        } catch (error) {
            console.error(`❌ Error reading file ${file}:`, error);
        }
    }

    // Filter to only include groups with duplicates (more than 1 file)
    const duplicates: DuplicateGroup[] = [];
    for (const [attributeKey, fileList] of attributeMap) {
        if (fileList.length > 1) {
            duplicates.push({
                attributeKey,
                files: fileList,
            });
        }
    }

    return duplicates;
};

/**
 * Main function to run the duplicate check
 */
const checkMetadata = (): void => {
    console.log("╔═══════════════════════════════════════════════════════════╗");
    console.log("║           NFT Metadata Duplicate Checker                  ║");
    console.log("╚═══════════════════════════════════════════════════════════╝");

    if (!fs.existsSync(jsonDir)) {
        console.error(`\n❌ JSON directory not found: ${jsonDir}`);
        console.log("Please run the art generation first.");
        process.exit(1);
    }

    const duplicates = findDuplicateAttributes();

    if (duplicates.length === 0) {
        console.log("✅ No duplicates found! All NFTs have unique attribute combinations.\n");
    } else {
        console.log(`⚠️  Found ${duplicates.length} duplicate group(s):\n`);
        console.log("─".repeat(60));

        duplicates.forEach((group, index) => {
            console.log(`\n📁 Duplicate Group ${index + 1}:`);
            console.log(`   Files with identical attributes:`);
            group.files.forEach((file) => {
                console.log(`   • ${file}`);
            });
            console.log(`\n   Shared Attributes:`);
            const attrs: Attribute[] = JSON.parse(group.attributeKey);
            attrs.forEach((attr) => {
                console.log(`   - ${attr.trait_type}: ${attr.value}`);
            });
            console.log("─".repeat(60));
        });

        console.log(`\n📊 Summary:`);
        console.log(`   Total duplicate groups: ${duplicates.length}`);
        const totalDuplicateFiles = duplicates.reduce(
            (sum, group) => sum + group.files.length,
            0
        );
        console.log(`   Total files with duplicates: ${totalDuplicateFiles}`);
        console.log(`   Unique duplicated NFTs: ${totalDuplicateFiles - duplicates.length}\n`);
    }
};

// Run the checker
checkMetadata();
