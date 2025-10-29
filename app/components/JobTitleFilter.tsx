// app/components/JobTitleFilter.tsx - With French and English titles
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';

interface JobTitleFilterProps {
  selectedTitles: string[];
  allJobs: any[];
  onChange: (titles: string[]) => void;
}

interface JobTitle {
  french: string;
  english?: string;
}

interface JobCategory {
  name: string;
  titles: JobTitle[];
}

// Job title categories with French and English equivalents
const JOB_CATEGORIES: JobCategory[] = [
  {
    name: 'Systèmes',
    titles: [
      { french: 'Administrateur systèmes', english: 'System Administrator' },
      { french: 'Ingénieur systèmes', english: 'System Engineer' },
      { french: 'Architecte systèmes', english: 'System Architect' },
      { french: 'Expert systèmes', english: 'System Expert' },
      { french: 'Technicien systèmes', english: 'System Technician' },
      { french: 'Consultant systèmes', english: 'Systems Consultant' },
      { french: 'Responsable systèmes', english: 'Head of Systems' },
      { french: 'Chef de projet systèmes', english: 'Systems Project Manager' },
      { french: 'Administrateur Windows', english: 'Windows Administrator' },
      { french: 'Administrateur Linux', english: 'Linux Administrator' },
      { french: 'Administrateur Unix', english: 'Unix Administrator' },
      { french: 'Ingénieur Active Directory', english: 'Active Directory Engineer' },
      { french: 'Ingénieur virtualisation', english: 'Virtualization Engineer' },
      { french: 'Administrateur VMware', english: 'VMware Administrator' },
      { french: 'Ingénieur Citrix', english: 'Citrix Engineer' },
      { french: 'Ingénieur stockage', english: 'Storage Engineer' },
      { french: 'Administrateur sauvegarde', english: 'Backup Administrator' },
      { french: 'Ingénieur sauvegarde', english: 'Backup Engineer' },
      { french: 'Spécialiste patch management', english: 'Patch Management Specialist' },
      { french: 'Ingénieur automatisation systèmes', english: 'Systems Automation Engineer' },
      { french: 'Administrateur Ansible', english: 'Ansible Administrator' },
      { french: 'Administrateur Puppet', english: 'Puppet Administrator' },
      { french: 'Administrateur Chef', english: 'Chef Administrator' },
    ]
  },
  {
    name: 'Réseaux & Télécoms',
    titles: [
      { french: 'Administrateur réseaux', english: 'Network Administrator' },
      { french: 'Ingénieur réseaux', english: 'Network Engineer' },
      { french: 'Architecte réseaux', english: 'Network Architect' },
      { french: 'Expert réseaux', english: 'Network Expert' },
      { french: 'Consultant réseaux', english: 'Network Consultant' },
      { french: 'Responsable réseaux', english: 'Network Manager' },
      { french: 'Technicien réseaux', english: 'Network Technician' },
      { french: 'Ingénieur sécurité réseau', english: 'Network Security Engineer' },
      { french: 'Ingénieur télécom', english: 'Telecom Engineer' },
      { french: 'Administrateur pare-feu', english: 'Firewall Administrator' },
      { french: 'Ingénieur LAN', english: 'LAN Engineer' },
      { french: 'Ingénieur WAN', english: 'WAN Engineer' },
      { french: 'Ingénieur SD-WAN', english: 'SD-WAN Engineer' },
      { french: 'Ingénieur Wi-Fi', english: 'Wireless Network Engineer' },
      { french: 'Ingénieur Load Balancer', english: 'Load Balancer Engineer' },
      { french: 'Ingénieur DNS', english: 'DNS Engineer' },
      { french: 'Ingénieur DHCP', english: 'DHCP Engineer' },
      { french: 'Ingénieur IPAM', english: 'IPAM Engineer' },
      { french: 'Ingénieur VoIP', english: 'VoIP Engineer' },
      { french: 'Ingénieur réseau cloud', english: 'Cloud Network Engineer' },
    ]
  },
  {
    name: 'Bases de Données',
    titles: [
      { french: 'Administrateur base de données', english: 'Database Administrator' },
      { french: 'Ingénieur base de données', english: 'Database Engineer' },
      { french: 'Architecte base de données', english: 'Database Architect' },
      { french: 'Consultant base de données', english: 'Database Consultant' },
      { french: 'Responsable base de données', english: 'Database Manager' },
      { french: 'DBA Oracle', english: 'Oracle DBA' },
      { french: 'DBA SQL Server', english: 'SQL Server DBA' },
      { french: 'DBA MySQL', english: 'MySQL DBA' },
      { french: 'DBA PostgreSQL', english: 'PostgreSQL DBA' },
      { french: 'DBA MongoDB', english: 'MongoDB DBA' },
      { french: 'DBA NoSQL', english: 'NoSQL DBA' },
      { french: 'Ingénieur haute disponibilité', english: 'High Availability Engineer' },
      { french: 'Ingénieur réplication', english: 'Replication Engineer' },
      { french: 'Ingénieur cluster', english: 'Clustering Engineer' },
      { french: 'DBA DevOps', english: 'DevOps DBA' },
    ]
  },
  {
    name: 'Production & Exploitation',
    titles: [
      { french: 'Technicien d\'exploitation', english: 'Operations Technician' },
      { french: 'Exploitant informatique', english: 'IT Operator' },
      { french: 'Analyste d\'exploitation', english: 'Operations Analyst' },
      { french: 'Ingénieur d\'exploitation', english: 'Operations Engineer' },
      { french: 'Administrateur d\'exploitation', english: 'Operations Administrator' },
      { french: 'Chef d\'exploitation', english: 'Operations Manager' },
      { french: 'Responsable d\'exploitation', english: 'Head of Operations' },
      { french: 'Ingénieur de production', english: 'Production Engineer' },
      { french: 'Ingénieur production', english: 'Production Engineer' },
      { french: 'Ingénieur d\'applications', english: 'Application Engineer' },
      { french: 'Ingénieur applications', english: 'Application Engineer' },
      { french: 'Ingénieur middleware', english: 'Middleware Engineer' },
      { french: 'Administrateur applicatif', english: 'Application Administrator' },
      { french: 'Analyste supervision', english: 'Monitoring Analyst' },
      { french: 'Ingénieur supervision', english: 'Monitoring Engineer' },
      { french: 'Administrateur d\'ordonnanceur', english: 'Job Scheduler Administrator' },
      { french: 'Administrateur ordonnanceur', english: 'Job Scheduler Administrator' },
      { french: 'Ingénieur ordonnanceur', english: 'Scheduling Engineer' },
      { french: 'Administrateur batch', english: 'Batch Administrator' },
      { french: 'Ingénieur support de production', english: 'Production Support Engineer' },
      { french: 'Ingénieur support production', english: 'Production Support Engineer' },
      { french: 'Responsable continuité de service', english: 'Service Continuity Manager' },
    ]
  },
  {
    name: 'Cloud & Automatisation',
    titles: [
      { french: 'Ingénieur cloud', english: 'Cloud Engineer' },
      { french: 'Architecte cloud', english: 'Cloud Architect' },
      { french: 'Administrateur cloud', english: 'Cloud Administrator' },
      { french: 'Consultant cloud', english: 'Cloud Consultant' },
      { french: 'Spécialiste migration cloud', english: 'Cloud Migration Specialist' },
      { french: 'Ingénieur DevOps', english: 'DevOps Engineer' },
      { french: 'Ingénieur fiabilité', english: 'Site Reliability Engineer' },
      { french: 'SRE', english: 'Site Reliability Engineer' },
      { french: 'Platform Engineer', english: 'Platform Engineer' },
      { french: 'Infrastructure as Code Engineer', english: 'IaC Engineer' },
      { french: 'Ingénieur Terraform', english: 'Terraform Engineer' },
      { french: 'Ingénieur Ansible', english: 'Ansible Engineer' },
      { french: 'Cloud Operations Engineer', english: 'CloudOps Engineer' },
      { french: 'FinOps Specialist', english: 'FinOps Specialist' },
      { french: 'Ingénieur conteneurisation', english: 'Containerization Engineer' },
      { french: 'Administrateur Kubernetes', english: 'Kubernetes Administrator' },
      { french: 'Ingénieur Docker', english: 'Docker Engineer' },
    ]
  },
  {
    name: 'Sécurité',
    titles: [
      { french: 'Ingénieur sécurité systèmes', english: 'Systems Security Engineer' },
      { french: 'Ingénieur sécurité réseaux', english: 'Network Security Engineer' },
      { french: 'Analyste sécurité', english: 'Security Analyst' },
      { french: 'Administrateur sécurité', english: 'Security Administrator' },
      { french: 'Architecte sécurité', english: 'Security Architect' },
      { french: 'Consultant sécurité', english: 'Security Consultant' },
      { french: 'Ingénieur IAM', english: 'IAM Engineer' },
      { french: 'Administrateur PKI', english: 'PKI Administrator' },
      { french: 'SOC Analyst', english: 'SOC Analyst' },
      { french: 'Ingénieur SIEM', english: 'SIEM Engineer' },
      { french: 'Ingénieur sécurité cloud', english: 'Cloud Security Engineer' },
    ]
  },
  {
    name: 'Management',
    titles: [
      { french: 'Responsable infrastructure', english: 'Head of Infrastructure' },
      { french: 'Infrastructure Manager', english: 'Infrastructure Manager' },
      { french: 'Directeur technique', english: 'CTO' },
      { french: 'CTO', english: 'Chief Technical Officer' },
      { french: 'Responsable production', english: 'Head of Production' },
      { french: 'Responsable systèmes et réseaux', english: 'Head of Systems & Networks' },
      { french: 'Delivery Manager', english: 'Delivery Manager' },
      { french: 'Service Delivery Manager', english: 'Service Delivery Manager' },
      { french: 'Incident Manager', english: 'Incident Manager' },
      { french: 'Problem Manager', english: 'Problem Manager' },
      { french: 'Change Manager', english: 'Change Manager' },
      { french: 'Capacity Manager', english: 'Capacity Manager' },
      { french: 'Release Manager', english: 'Release Manager' },
    ]
  },
];

export default function JobTitleFilter({ selectedTitles, allJobs, onChange }: JobTitleFilterProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Systèmes']));
  const [searchTerm, setSearchTerm] = useState('');

  // Get display text for a title (shows both French and English if available)
  const getDisplayText = (title: JobTitle): string => {
    if (title.english && title.english !== title.french) {
      return `${title.french} / ${title.english}`;
    }
    return title.french;
  };

  // Get search value (just the French title for comparison)
  const getTitleValue = (title: JobTitle): string => {
    return title.french;
  };

  // Filter categories based on search - searches in both French and English
  const filteredCategories = searchTerm
    ? JOB_CATEGORIES.map(category => ({
        ...category,
        titles: category.titles.filter(title =>
          title.french.toLowerCase().includes(searchTerm.toLowerCase()) ||
          title.english?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          category.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })).filter(category => 
        category.titles.length > 0 || category.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : JOB_CATEGORIES;

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleTitle = (titleValue: string) => {
    const newSelected = selectedTitles.includes(titleValue)
      ? selectedTitles.filter(t => t !== titleValue)
      : [...selectedTitles, titleValue];
    onChange(newSelected);
  };

  const selectAll = () => {
    const allTitles = JOB_CATEGORIES.flatMap(cat => cat.titles.map(t => getTitleValue(t)));
    onChange(allTitles);
  };

  const deselectAll = () => {
    onChange([]);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-800">Type de Poste</h3>
          <span className="text-xs text-gray-500">
            ({selectedTitles.length} sélectionné{selectedTitles.length > 1 ? 's' : ''})
          </span>
        </div>
        
        {/* Search bar */}
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher (FR/EN)..."
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
          const isExpanded = expandedCategories.has(category.name);
          const selectedCount = category.titles.filter(t => selectedTitles.includes(getTitleValue(t))).length;
          
          return (
            <div key={category.name} className="border-b border-gray-100 last:border-0">
              {/* Category header */}
              <button
                onClick={() => toggleCategory(category.name)}
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {category.name}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  ({selectedCount}/{category.titles.length})
                </span>
              </button>

              {/* Category titles */}
              {isExpanded && (
                <div className="px-3 pb-2">
                  {category.titles.map((title, idx) => {
                    const titleValue = getTitleValue(title);
                    const isSelected = selectedTitles.includes(titleValue);
                    
                    return (
                      <label
                        key={`${titleValue}-${idx}`}
                        className={`flex items-center py-1.5 px-2 rounded cursor-pointer hover:bg-gray-50 ${
                          isSelected ? 'bg-blue-50' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleTitle(titleValue)}
                          className="h-3.5 w-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className={`ml-2 text-xs flex-1 ${
                          isSelected ? 'text-blue-900 font-medium' : 'text-gray-700'
                        }`}>
                          {getDisplayText(title)}
                        </span>
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