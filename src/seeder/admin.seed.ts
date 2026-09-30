import { AppDataSource } from '../config/database.config';
import { LetterKind, Role } from '../constants/appConstant';
import { Admin, AdminPermission } from '../entities/admin/Admin.entity';
import { LetterEntity } from '../entities/letter/Letter.entity';
import { ProductEntity } from '../entities/product/Product.entity';

const ADMINS = [
  {
    name: 'Stradmont Admin',
    email: 'admin@stradmontsolutions.com',
    password: 'Admin@123',
    role: Role.ADMIN,
    permissions: [
      AdminPermission.PRODUCT,
      AdminPermission.LETTERS,
      AdminPermission.CONTACTS,
      AdminPermission.LOGS,
    ],
    isActive: true,
  },
  {
    name: 'Stradmont Super Admin',
    email: 'superadmin@stradmontsolutions.com',
    password: 'SuperAdmin@123',
    role: Role.SUPER_ADMIN,
    isActive: true,
  },
];

const INITIAL_PRODUCTS = [
  {
    name: 'Builders Base',
    slug: 'builders-base',
    tag: 'Platform',
    status: 'In development',
    logo: '/buildersbase-logo.jpeg',
    url: 'https://thebuildersbase.com',
    body: 'Builders Base is software that helps insurance distribution organizations develop their people, support their leaders, and grow their organizations.',
    isActive: true,
  },
];

const INITIAL_LETTERS = [
  {
    slug: 'why-operating-software-should-be-written-down-before-it-is-written',
    number: '01',
    kind: LetterKind.LETTER,
    date: 'September 2026',
    readTime: '5 min read',
    title:
      'Why mission-critical software should be written down before it is written',
    body: 'Technical debt rarely originates from poor syntax; it stems from unwritten architecture. How concise design briefs preserve institutional memory across engineering and finance teams.',
    image: '/images/letters/design-docs.jpg',
    author: 'Stradmont Engineering',
    authorTitle: 'Systems Architecture',
    isPublished: true,
    content: [
      {
        paragraphs: [
          'As organizations grow beyond their initial product iteration, a subtle failure mode emerges: SaaS platforms and critical workflows are constructed before their architectural assumptions are articulated. A requirement is discussed in passing, an engineer opens a branch, and within weeks production hosts a critical pipeline whose edge cases exist solely in the recollection of whoever authored the commit.',
          'In financial institutions and regulated environments, this dynamic compounds quickly. When systems change hands or teams scale, what began as a pragmatic sprint to delivery hardens into architectural ambiguity that future engineers hesitate to touch.',
        ],
      },
      {
        heading: 'The specification as a reasoning instrument',
        paragraphs: [
          'A design document is fundamentally distinct from post-hoc user documentation. Documentation catalogues what a codebase does once finished; a specification interrogates what a system ought to achieve before capital and engineering cycles are committed.',
          'Committing thoughts to clear prose forces an explicit examination that whiteboard sketches and verbal agreements routinely bypass. Writing exposes the unhandled failure modes, highlights unstated dependencies between services, and surfaces conflicting requirements between financial controllers and technical leads.',
          'Disagreements resolved in a three-page text document cost an afternoon. The same disagreements discovered after database migrations and production deployments demand weeks of painful re-architecture.',
        ],
      },
      {
        heading: 'Preserving custody of architectural intent',
        paragraphs: [
          'The most enduring contribution of a written specification is not merely the initial decision, but the context surrounding what was rejected. When a developer encounters an unusual caching layer or custom validation step two years later, source code explains the mechanics, but rarely the rationale.',
          'Without written records of architectural constraints, subsequent teams frequently dismantle critical safeguards under the impression that they were unnecessary legacy cruft. Written specifications transform institutional memory from an oral tradition into durable operational infrastructure.',
        ],
      },
      {
        heading: 'Pragmatism over bureaucracy',
        paragraphs: [
          'Rigorous technical documentation need not resemble waterfall enterprise bureaucracy. At Stradmont, we rely on concise, focused briefs structured around four primary questions: the specific failure mode being remedied, the operational constraints, the evaluated alternatives, and the measurable criteria for production verification.',
          'Two pages of thoughtful prose will consistently outperform fifty pages of template boilerplate. The objective is clarity of thought and alignment of intent before a single line of software is committed.',
        ],
      },
    ],
  },
  {
    slug: 'latency-is-a-governance-problem',
    number: '02',
    kind: LetterKind.NOTE,
    date: 'August 2026',
    readTime: '4 min read',
    title: 'Latency is a governance problem',
    body: 'Every cache expiration and scheduled batch is an unspoken statement about the allowable freshness of financial truth. Why data latency is fundamentally an executive governance decision.',
    image: '/images/letters/latency.jpg',
    author: 'Stradmont Research',
    authorTitle: 'Finance & Infrastructure',
    isPublished: true,
    content: [
      {
        paragraphs: [
          'Across capital markets and financial technology platforms, discussions regarding latency are almost exclusively categorized as engineering concerns—benchmarked in milliseconds, CPU cycles, and network hops. Yet at the boundary where operational data informs capital allocation, latency is rarely a technical metric; it is an organizational governance policy.',
        ],
      },
      {
        heading: 'The silent policies of cache timeouts',
        paragraphs: [
          'When a software engineer chooses a sixty-second TTL on an internal Redis cluster, they are establishing an implicit organizational decree: that ledger viewers are authorized to make decisions on data that is one minute stale. When a batch ETL pipeline is scheduled to run at 02:00 UTC, leadership is tacitly accepting an eighteen-hour latency window on intra-day operational exposure.',
          'These decisions are almost never deliberated in executive committees or documented in risk frameworks. They are chosen by developers attempting to minimize database connection pools or prevent CPU throttling. Technical prudence inadvertently dictates institutional risk posture.',
        ],
      },
      {
        heading: 'When stale data translates to capital exposure',
        paragraphs: [
          'In consumer software, stale read replicas merely cause mild interface discrepancies. In credit facilities, collateral management, or risk accounting, stale state introduces severe legal and balance sheet implications.',
          'If an automated margin calculation operates against pricing snapshots that lag active settlement systems by twenty minutes, the institution is extending unhedged credit during periods of volatility. When auditors request proof of continuous position monitoring, explaining that an unmonitored cron job failed to trigger is an uncomfortable position.',
        ],
      },
      {
        heading: 'Designing explicit freshness contracts',
        paragraphs: [
          'Mature financial systems treat latency as a contractual parameter between domain boundaries. For every shared data artifact, systems architects and domain stakeholders must explicitly codify allowable staleness, degradation behavior under network partitions, and fallback protocols when upstream feeds fall out of tolerance.',
          'When data freshness requirements are articulated with precision, engineering teams can design purpose-built propagation layers rather than over-engineering distributed caching solutions blindly. Latency ceases to be an accidental consequence and becomes a deliberate, governed operational parameter.',
        ],
      },
    ],
  },
  {
    slug: 'the-finance-data-layer-nobody-owns',
    number: '03',
    kind: LetterKind.STUDY,
    date: 'July 2026',
    readTime: '7 min read',
    title: 'The finance data layer nobody owns',
    body: 'A practical examination of the fragmented territory between core transaction engines and audited financial reporting—and what happens when an organization establishes explicit custody over it.',
    image: '/images/letters/data-layer.jpg',
    author: 'Stradmont Research',
    authorTitle: 'Operational Systems',
    isPublished: true,
    content: [
      {
        paragraphs: [
          'In nearly every growth-stage institution with complex transactional flows, there is an unmapped territory that sits directly between production operational databases and external reporting ledgers. It is composed of scheduled SQL queries, scheduled CSV exports, manual spreadsheet transformations, and localized reconciliation scripts.',
          'It represents the foundation upon which executive decisions and regulatory filings are formed. And almost universally, no single group within the company has formal stewardship over it.',
        ],
      },
      {
        heading: 'The architectural schism',
        paragraphs: [
          'Product engineering teams build for user concurrency, latency, and feature throughput. Their schema designs prioritize rapid read/write operations and relational integrity for active user sessions. Accounting and finance teams, conversely, require immutable historical state, point-in-time ledgers, and audit traceability.',
          "Because neither group's primary tooling naturally accommodates the other's operational paradigm, a middle layer inevitably grows organically to bridge the gap. Analysts write Python scripts to normalize timestamps; operations specialists maintain macros to categorize fee splits; finance managers manually adjust journal entries each billing cycle.",
          'Over time, this connective tissue grows more complicated than the primary applications it draws from, without benefitting from version control, continuous integration, or automated regression testing.',
        ],
      },
      {
        heading: 'The cost of undocumented reconciliation',
        paragraphs: [
          'The liabilities of an orphaned finance data layer do not appear as software crashes in monitoring dashboards. They manifest as prolonged month-end closing cycles, disputed merchant statements, and weeks lost reconstructing provenance during annual audits.',
          'When discrepancies arise between what payment gateways report and what the general ledger records, engineering and finance teams spend days trading spreadsheets, attempting to isolate whether an edge case was introduced by code deployments or upstream settlement delays. The true tax on the business is not server cost, but organizational paralysis.',
        ],
      },
      {
        heading: 'Custody before code',
        paragraphs: [
          'Remediating this operational friction cannot be accomplished solely by purchasing additional BI dashboards or data warehouse tooling. The primary remedy is jurisdictional: an organization must establish clear custody over the financial data pipeline as a first-class production system.',
          'When the finance data layer is treated with the same architectural discipline as core transactional systems—with strict data contracts, reproducible transformations, immutable logging, and clear ownership—close cycles contract from weeks to hours.',
          'Sound financial systems are not born from heroic manual reconciliations; they are the result of deliberate operational architecture that runs reliably every single day.',
        ],
      },
    ],
  },
];

const AdminRepo = AppDataSource.getRepository(Admin);
const ProductRepo = AppDataSource.getRepository(ProductEntity);
const LetterRepo = AppDataSource.getRepository(LetterEntity);

const args = process.argv[2];
if (!args) {
  throw new Error('Please provide an argument (add | remove)');
}

const seedAll = async () => {
  for (const item of ADMINS) {
    try {
      const existing = await AdminRepo.findOne({
        where: { email: item.email },
      });
      if (!existing) {
        const admin = AdminRepo.create(item);
        await AdminRepo.save(admin);
      }
    } catch (error: any) {
      console.error('Failed to seed admin', error);
      return;
    }
  }
  console.log('Admins seeded successfully');

  for (const prod of INITIAL_PRODUCTS) {
    const existing = await ProductRepo.findOne({ where: { slug: prod.slug } });
    if (!existing) {
      await ProductRepo.save(ProductRepo.create(prod));
    }
  }
  console.log('Products seeded successfully');

  for (const letter of INITIAL_LETTERS) {
    const existing = await LetterRepo.findOne({ where: { slug: letter.slug } });
    if (!existing) {
      await LetterRepo.save(LetterRepo.create(letter));
    }
  }
  console.log('Stradmont Letters seeded successfully');

  await AppDataSource.destroy();
  process.exit(0);
};

const removeAll = async () => {
  try {
    await AdminRepo.createQueryBuilder().delete().execute();
    await ProductRepo.createQueryBuilder().delete().execute();
    await LetterRepo.createQueryBuilder().delete().execute();
  } catch (error: any) {
    console.error('Failed to delete seeded records', error);
    process.exit(1);
  }
  console.log('Seeded records removed successfully');
  await AppDataSource.destroy();
  process.exit(0);
};

AppDataSource.initialize()
  .then(() => {
    if (args === 'add') {
      seedAll();
    } else if (args === 'remove') {
      removeAll();
    } else {
      console.log('Please provide a valid argument: add | remove');
    }
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
