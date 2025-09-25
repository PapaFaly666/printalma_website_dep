pfdev@PC:/mnt/c/Users/HP/Desktop/printalma-perso/printalma_website_dep$ npm run build

> printalma_website@0.0.0 build
> tsc -b && vite build

src/pages/vendor/VendorFundsRequestPage.tsx:128:33 - error TS2339: Property 'totalEarnings' does not exist on type '{ totalProducts: number; publishedProducts: number; draftProducts: number; pendingProducts: number; totalValue: number; averagePrice: number; architecture: "v2_preserved_admin"; }'.

128             totalEarnings: data.totalEarnings || 0,
                                    ~~~~~~~~~~~~~

src/pages/vendor/VendorFundsRequestPage.tsx:129:33 - error TS2339: Property 'pendingAmount' does not exist on type '{ totalProducts: number; publishedProducts: number; draftProducts: number; pendingProducts: number; totalValue: number; averagePrice: number; architecture: "v2_preserved_admin"; }'.   

129             pendingAmount: data.pendingAmount || 0,
                                    ~~~~~~~~~~~~~

src/pages/vendor/VendorFundsRequestPage.tsx:130:35 - error TS2339: Property 'availableBalance' does not exist on type '{ totalProducts: number; publishedProducts: number; draftProducts: number; pendingProducts: number; totalValue: number; averagePrice: number; architecture: "v2_preserved_admin"; }'.

130             availableAmount: data.availableBalance || 0,
                                      ~~~~~~~~~~~~~~~~

src/pages/vendor/VendorFundsRequestPage.tsx:131:37 - error TS2339: Property 'monthlyRevenue' does not exist on type '{ totalProducts: number; publishedProducts: number; draftProducts: number; pendingProducts: number; totalValue: number; averagePrice: number; architecture: "v2_preserved_admin"; }'.  

131             thisMonthEarnings: data.monthlyRevenue || 0,
                                        ~~~~~~~~~~~~~~

src/pages/vendor/VendorFundsRequestPage.tsx:132:49 - error TS2339: Property 'monthlyRevenue' does not exist on type '{ totalProducts: number; publishedProducts: number; draftProducts: number; pendingProducts: number; totalValue: number; averagePrice: number; architecture: "v2_preserved_admin"; }'.  

132             lastMonthEarnings: Math.floor((data.monthlyRevenue || 0) * 0.8),
                                                    ~~~~~~~~~~~~~~

src/pages/vendor/VendorFundsRequestPage.tsx:133:34 - error TS2339: Property 'totalEarnings' does not exist on type '{ totalProducts: number; publishedProducts: number; draftProducts: number; pendingProducts: number; totalValue: number; averagePrice: number; architecture: "v2_preserved_admin"; }'.   

133             commissionPaid: data.totalEarnings - data.availableBalance - data.pendingAmount || 0,
                                     ~~~~~~~~~~~~~

src/pages/vendor/VendorFundsRequestPage.tsx:133:55 - error TS2339: Property 'availableBalance' does not exist on type '{ totalProducts: number; publishedProducts: number; draftProducts: number; pendingProducts: number; totalValue: number; averagePrice: number; architecture: "v2_preserved_admin"; }'.

133             commissionPaid: data.totalEarnings - data.availableBalance - data.pendingAmount || 0,
                                                          ~~~~~~~~~~~~~~~~

src/pages/vendor/VendorFundsRequestPage.tsx:133:79 - error TS2339: Property 'pendingAmount' does not exist on type '{ totalProducts: number; publishedProducts: number; draftProducts: number; pendingProducts: number; totalValue: number; averagePrice: number; architecture: "v2_preserved_admin"; }'.   

133             commissionPaid: data.totalEarnings - data.availableBalance - data.pendingAmount || 0,
                                                                                  ~~~~~~~~~~~~~     

src/pages/vendor/VendorFundsRequestPage.tsx:134:35 - error TS2339: Property 'totalEarnings' does not exist on type '{ totalProducts: number; publishedProducts: number; draftProducts: number; pendingProducts: number; totalValue: number; averagePrice: number; architecture: "v2_preserved_admin"; }'.   

134             totalCommission: data.totalEarnings || 0,
                                      ~~~~~~~~~~~~~

src/pages/vendor/VendorFundsRequestPage.tsx:135:41 - error TS2339: Property 'averageCommissionRate' does not exist on type '{ totalProducts: number; publishedProducts: number; draftProducts: number; pendingProducts: number; totalValue: number; averagePrice: number; architecture: "v2_preserved_admin"; }'.

135             averageCommissionRate: data.averageCommissionRate || 0
                                            ~~~~~~~~~~~~~~~~~~~~~


Found 10 errors.

pfdev@PC:/mnt/c/Users/HP/Desktop/printalma-perso/printalma_website_dep$ 