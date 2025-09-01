import React, { useState } from 'react';

interface Tab {
    id: string;
    label: string;
    content?: () => React.JSX.Element;
}

const tabs: Tab[] = [
    { id: 'bestsellers', label: 'Meilleures ventes' },
    { id: 'new', label: 'Nouveautés' },
    { id: 'design', label: 'Design' },
    { id: 'influencers', label: 'Influenceurs' },
    { id: 'artists', label: 'Artiste' }
];

const HorizontalTabs = () => {
    const [activeTab, setActiveTab] = useState('bestsellers');

    return (
        <div className="w-full bg-white py-6 border-b border-gray-100">
            <div className="container mx-auto px-4 lg:px-8">
                {/* Navigation horizontale centrée verticalement */}
                <div className="flex items-center justify-center">
                    <nav className="flex items-center space-x-8">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    relative px-4 py-3 text-sm font-medium transition-all duration-300 
                                    flex items-center justify-center whitespace-nowrap
                                    ${activeTab === tab.id
                                        ? 'text-blue-600 border-b-2 border-blue-600'
                                        : 'text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300'
                                    }
                                `}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>
        </div>
    );
};

export default HorizontalTabs;