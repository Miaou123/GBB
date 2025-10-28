// app/components/JobTitleFilter.tsx
'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { matchesJobTitle } from '@/lib/utils';

interface JobTitleFilterProps {
  selectedTitles: string[];
  allJobs: any[];
  onChange: (titles: string[]) => void;
}

interface JobCategory {
  name: string;
  titles: string[];
}

// Normalized job title database (singular forms only)
const JOB_CATEGORIES: JobCategory[] = [
  {
    name: 'Systèmes',
    titles: [
      'Administrateur système',
      'Ingénieur système',
      'Architecte système',
      'Expert système',
      'Technicien système',
      'Consultant système',
      'Responsable système',
      'Chef de projet système',
      'Administrateur Windows',
      'Administrateur Linux',
      'Administrateur Unix',
      'Ingénieur Active Directory',
      'Ingénieur virtualisation',
      'Administrateur VMware',
      'Ingénieur Citrix',
      'Ingénieur stockage',
      'Administrateur sauvegarde',
      'Ingénieur sauvegarde',
      'Spécialiste patch management',
      'Ingénieur automatisation système',
      'Administrateur Ansible',
      'Administrateur Puppet',
      'Administrateur Chef',
    ]
  },
  {
    name: 'Réseaux & Télécoms',
    titles: [
      'Administrateur réseau',
      'Ingénieur réseau',
      'Architecte réseau',
      'Expert réseau',
      'Consultant réseau',
      'Responsable réseau',
      'Technicien réseau',
      'Ingénieur sécurité réseau',
      'Ingénieur télécom',
      'Administrateur pare-feu',
      'Ingénieur LAN',
      'Ingénieur WAN',
      'Ingénieur SD-WAN',
      'Ingénieur Wi-Fi',
      'Ingénieur Load Balancer',
      'Ingénieur DNS',
      'Ingénieur DHCP',
      'Ingénieur IPAM',
      'Ingénieur VoIP',
      'Ingénieur réseau cloud',
    ]
  },
  {
    name: 'Bases de Données',
    titles: [
      'Administrateur base de données',
      'Ingénieur base de données',
      'Architecte base de données',
      'Consultant base de données',
      'Responsable base de données',
      'DBA Oracle',
      'DBA SQL Server',
      'DBA MySQL',
      'DBA PostgreSQL',
      'DBA MongoDB',
      'DBA NoSQL',
      'Ingénieur haute disponibilité',
      'Ingénieur réplication',
      'Ingénieur cluster',
      'DBA DevOps',
      'SRE DBA',
    ]
  },
  {
    name: 'Production & Exploitation',
    titles: [
      'Technicien d\'exploitation',
      'Exploitant informatique',
      'Analyste d\'exploitation',
      'Ingénieur d\'exploitation',
      'Administrateur d\'exploitation',
      'Chef d\'exploitation',
      'Responsable d\'exploitation',
      'Ingénieur de production',
      'Ingénieur production',
      'Ingénieur d\'application',
      'Ingénieur application',
      'Ingénieur middleware',
      'Administrateur applicatif',
      'Analyste supervision',
      'Ingénieur supervision',
      'Administrateur d\'ordonnanceur',
      'Administrateur ordonnanceur',
      'Ingénieur ordonnanceur',
      'Administrateur batch',
      'Ingénieur support de production',
      'Ingénieur support production',
      'Responsable continuité de service',
    ]
  },
  {
    name: 'Cloud & Automatisation',
    titles: [
      'Ingénieur cloud',
      'Architecte cloud',
      'Administrateur cloud',
      'Consultant cloud',
      'Spécialiste migration cloud',
      'Ingénieur DevOps',
      'Site Reliability Engineer',
      'SRE',
      'Platform Engineer',
      'Infrastructure as Code Engineer',
      'IaC Engineer',
      'Ingénieur Terraform',
      'Ingénieur Ansible',
      'Cloud Operations Engineer',
      'CloudOps Engineer',
      'FinOps Specialist',
      'Ingénieur conteneurisation',
      'Administrateur Kubernetes',
      'Ingénieur Docker',
    ]
  },
  {
    name: 'Sécurité',
    titles: [
      'Ingénieur sécurité système',
      'Ingénieur sécurité réseau',
      'Analyste sécurité',
      'Administrateur sécurité',
      'Architecte sécurité',
      'Consultant sécurité',
      'Ingénieur IAM',
      'Administrateur PKI',
      'SOC Analyst L1',
      'SOC Analyst L2',
      'SOC Analyst L3',
      'Ingénieur SIEM',
      'Ingénieur sécurité cloud',
    ]
  },
  {
    name: 'Management',
    titles: [
      'Responsable infrastructure',
      'Head of Infrastructure',
      'Infrastructure Manager',
      'Directeur technique',
      'CTO',
      'Chief Technical Officer',
      'Responsable production',
      'Head of Production',
      'Responsable système et réseau',
      'Head of Systems & Networks',
      'Delivery Manager',
      'Service Delivery Manager',
      'Incident Manager',
      'Problem Manager',
      'Change Manager',
      'Capacity Manager',
      'Release Manager',
    ]
  },
];

export default function JobTitleFilter({ selectedTitles, allJobs, onChange }: JobTitleFilterProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Systèmes']));
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate job counts per category and title
  const categoryStats = useMemo(() => {
    const stats = new Map<string, { total: number; titleCounts: Map<string, number> }>();

    JOB_CATEGORIES.forEach(category => {
      const titleCounts = new Map<string, number>();
      let total = 0;

      category.titles.forEach(title => {
        const count = allJobs.filter(job => 
          matchesJobTitle(job.jobTitle, title)
        ).length;
        
        if (count > 0) {
          titleCounts.set(title, count);
          total += count;
        }
      });

      stats.set(category.name, { total, titleCounts });
    });

    return stats;
  }, [allJobs]);

  // Filter categories and titles based on search
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return JOB_CATEGORIES;

    const search = searchTerm.toLowerCase();
    return JOB_CATEGORIES.map(category => ({
      ...category,
      titles: category.titles.filter(title =>
        title.toLowerCase().includes(search) ||
        category.name.toLowerCase().includes(search)
      )
    })).filter(category => 
      category.titles.length > 0 || category.name.toLowerCase().includes(search)
    );
  }, [searchTerm]);

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleTitle = (title: string) => {
    const newSelected = selectedTitles.includes(title)
      ? selectedTitles.filter(t => t !== title)
      : [...selectedTitles, title];
    onChange(newSelected);
  };

  const selectAll = () => {
    const allTitles = JOB_CATEGORIES.flatMap(cat => cat.titles);
    onChange(allTitles);
  };

  const deselectAll = () => {
    onChange([]);
  };

  const totalJobs = Array.from(categoryStats.values()).reduce((sum, stat) => sum + stat.total, 0);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-800">Type de Poste</h3>
          <span className="text-xs text-gray-500">({totalJobs} offres)</span>
        </div>
        
        {/* Search bar */}
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Select/Deselect buttons */}
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            className="flex-1 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            Tout sélectionner
          </button>
          <button
            onClick={deselectAll}
            className="flex-1 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded transition-colors"
          >
            Tout désélectionner
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="max-h-96 overflow-y-auto">
        {filteredCategories.map(category => {
          const stats = categoryStats.get(category.name);
          const isExpanded = expandedCategories.has(category.name);
          
          if (!stats || stats.total === 0) return null;

          return (
            <div key={category.name} className="border-b border-gray-100 last:border-0">
              {/* Category header */}
              <button
                onClick={() => toggleCategory(category.name)}
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
                  )}
                  <span className="text-xs font-medium text-gray-700">{category.name}</span>
                </div>
                <span className="text-xs text-gray-500">({stats.total})</span>
              </button>

              {/* Job titles */}
              {isExpanded && (
                <div className="px-3 pb-2">
                  {category.titles.map(title => {
                    const count = stats.titleCounts.get(title) || 0;
                    if (count === 0) return null;

                    return (
                      <label
                        key={title}
                        className="flex items-center justify-between py-1 px-2 hover:bg-gray-50 rounded cursor-pointer group"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={selectedTitles.includes(title)}
                            onChange={() => toggleTitle(title)}
                            className="h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                          />
                          <span className="text-xs text-gray-700 truncate">{title}</span>
                        </div>
                        <span className="text-xs text-gray-400 ml-2 flex-shrink-0">({count})</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
