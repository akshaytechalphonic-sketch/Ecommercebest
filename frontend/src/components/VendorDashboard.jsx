import React, { useState, useEffect } from 'react';
import {
  Database,
  Coins,
  TrendingUp,
  Package,
  Plus,
  MoreHorizontal,
  ExternalLink,
  ShoppingBag,
  ArrowUpRight,
  Check,
  AlertCircle,
} from 'lucide-react';
import { productApi, userApi, financialApi } from '../services/api';

export const VendorDashboard = ({ user, onToast, onNavigate }) => {
  const [loading, setLoading] = useState(false);
  const [storeProducts, setStoreProducts] = useState([]);
  const [vendorFinancials, setVendorFinancials] = useState(null);

  // Fetch seller's actual products and financial earnings
  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        setLoading(true);
        const [prodRes, finRes] = await Promise.allSettled([
          productApi.getSellerProducts({ limit: 10 }),
          financialApi.getVendorEarnings(),
        ]);

        if (prodRes.status === 'fulfilled' && prodRes.value?.data?.products) {
          setStoreProducts(prodRes.value.data.products);
        }

        if (finRes.status === 'fulfilled' && finRes.value?.data) {
          setVendorFinancials(finRes.value.data);
        }
      } catch (e) {
        // Fallback gracefully
      } finally {
        setLoading(false);
      }
    };

    fetchSellerData();
  }, []);

  // SVG Chart Geometry for "Sales Overtime"
  const chartW = 500;
  const chartH = 220;
  const padLeft = 48;
  const padRight = 24;
  const padTop = 20;
  const padBottom = 30;

  // Exact data points matching reference image: 24, 25, 26, 27, 28, 29, 30, 31, 32, 33
  // Values: starts ~200k, dips at 26 to ~160k, rises at 28 to ~210k, dips at 30 to ~160k, rises at 32 to ~250k
  const chartPoints = [
    { label: '24', val: 200 },
    { label: '25', val: 180 },
    { label: '26', val: 160, isNode: true },
    { label: '27', val: 175 },
    { label: '28', val: 210, isNode: true },
    { label: '29', val: 185 },
    { label: '30', val: 160, isNode: true },
    { label: '31', val: 200 },
    { label: '32', val: 245, isNode: true },
    { label: '33', val: 240 },
  ];

  const plotW = chartW - padLeft - padRight;
  const plotH = chartH - padTop - padBottom;
  const minVal = 100;
  const maxVal = 300;

  const points = chartPoints.map((pt, i) => {
    const x = padLeft + (i * plotW) / (chartPoints.length - 1);
    const y = padTop + plotH - ((pt.val - minVal) / (maxVal - minVal)) * plotH;
    return { ...pt, x, y };
  });

  // Smooth Bezier Curve Path
  const makeSmoothPath = (pts) => {
    if (pts.length < 2) return '';
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cx1 = (p0.x + p1.x) / 2;
      const cy1 = p0.y;
      const cx2 = (p0.x + p1.x) / 2;
      const cy2 = p1.y;
      path += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  const linePath = makeSmoothPath(points);

  // Top Selling Products (from reference image)
  const topSelling = [
    {
      id: 1,
      title: 'Red Tape Sports Shoes for Men',
      sales: '569 Sales',
      stockText: '135 Stocks',
      status: 'Available',
      statusColor: '#10b981',
      img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=120&h=120&q=80',
    },
    {
      id: 2,
      title: 'HP 650 Laptop',
      sales: '213 Sales',
      stockText: '76 Stocks Remaining',
      status: 'Available',
      statusColor: '#10b981',
      img: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=120&h=120&q=80',
    },
    {
      id: 3,
      title: "Leriya Fashion Men's Shirt",
      sales: '951 Sales',
      stockText: '0 Stocks Remaining',
      status: 'Out of Stock',
      statusColor: '#ef4444',
      img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=120&h=120&q=80',
    },
  ];

  // Default Product List (from reference image + live store products)
  const productListRows =
    storeProducts.length > 0
      ? storeProducts.slice(0, 5).map((p) => ({
          name: p.title,
          price: `₹${Number(p.price).toLocaleString('en-IN')}`,
          qty: `${p.stock || 53} pcs`,
          status: (p.stock || 0) > 0 ? 'In Stock' : 'Out of Stock',
          isAvailable: (p.stock || 0) > 0,
          sold: `${p.sales_count || 20} pcs`,
          img:
            p.images?.[0]?.image_url ||
            p.image_url ||
            'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=100&h=100&q=80',
        }))
      : [
          {
            name: 'Marvel Thor Movie Print Marble T...',
            price: '₹2,300',
            qty: '53 pcs',
            status: 'In Stock',
            isAvailable: true,
            sold: '20 pcs',
            img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=100&h=100&q=80',
          },
          {
            name: 'Sony High-Res Wireless ANC Earbuds',
            price: '₹4,500',
            qty: '18 pcs',
            status: 'In Stock',
            isAvailable: true,
            sold: '34 pcs',
            img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=100&h=100&q=80',
          },
        ];

  const availableBalance = Number(
    vendorFinancials?.earnings?.available_earnings ??
    vendorFinancials?.vendor?.wallet_balance ??
    0
  );

  const pendingEscrow = Number(
    vendorFinancials?.earnings?.pending_earnings ?? 0
  );

  const grossRevenue = Number(
    vendorFinancials?.earnings?.lifetime_gross ??
    vendorFinancials?.earnings?.lifetime_net_earnings ??
    0
  );

  const commissionRate =
    vendorFinancials?.effective_commission_rate ??
    vendorFinancials?.vendor?.commission_rate ??
    '10.00';

  return (
    <div className="vd-container">
      {/* 1. Row 1: 3 Top KPI Cards */}
      <div className="vd-kpi-row">
        {/* Card 1: Available Wallet Balance (Dark Card) */}
        <div className="vd-card-primary">
          <div className="vd-kpi-head">
            <span className="vd-kpi-title">Available Wallet Balance</span>
            <div className="vd-kpi-icon-box-white">
              <Coins size={17} />
            </div>
          </div>
          <div className="vd-kpi-value">
            ₹{availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="vd-kpi-trend">
            <TrendingUp size={13} />
            <span>Ready for payout withdrawal</span>
          </div>
        </div>

        {/* Card 2: Pending Escrow (Light Card) */}
        <div className="vd-card-light">
          <div className="vd-kpi-head">
            <span className="vd-kpi-title">Pending Escrow Earnings</span>
            <div className="vd-kpi-icon-box-dark">
              <Database size={17} />
            </div>
          </div>
          <div className="vd-kpi-value">
            ₹{pendingEscrow.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="vd-kpi-trend">
            <TrendingUp size={13} />
            <span>Awaiting order payment / clearance</span>
          </div>
        </div>

        {/* Card 3: Total Gross Sales & Commission (Light Card) */}
        <div className="vd-card-light">
          <div className="vd-kpi-head">
            <span className="vd-kpi-title">Total Gross Sales</span>
            <div className="vd-kpi-icon-box-dark">
              <Package size={17} />
            </div>
          </div>
          <div className="vd-kpi-value">
            ₹{grossRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="vd-kpi-trend">
            <TrendingUp size={13} />
            <span>Commission rate: {commissionRate}%</span>
          </div>
        </div>
      </div>

      {/* 2. Row 2: Middle Section (Sales Overtime & Top Selling Products) */}
      <div className="vd-middle-row">
        {/* Sales Overtime Chart */}
        <div className="vd-card">
          <div className="vd-card-header">
            <span className="vd-section-title">Sales Overtime</span>
          </div>

          <div style={{ width: '100%', overflow: 'visible' }}>
            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
            >
              {/* Y-axis Labels & Dashed Gridlines: $300K, $250K, $200K, $150K, $100K */}
              {[
                { label: '$300K', val: 300 },
                { label: '$250K', val: 250 },
                { label: '$200K', val: 200 },
                { label: '$150K', val: 150 },
                { label: '$100K', val: 100 },
              ].map((grid, idx) => {
                const y = padTop + plotH - ((grid.val - minVal) / (maxVal - minVal)) * plotH;
                return (
                  <g key={idx}>
                    <text
                      x={padLeft - 10}
                      y={y + 4}
                      fill="#94a3b8"
                      fontSize="10"
                      fontWeight="500"
                      textAnchor="end"
                    >
                      {grid.label}
                    </text>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={chartW - padRight}
                      y2={y}
                      stroke="#f1f5f9"
                      strokeWidth="1"
                      strokeDasharray={idx === 4 ? '0' : '4 4'}
                    />
                  </g>
                );
              })}

              {/* Smooth Wavy Line Curve */}
              <path
                d={linePath}
                fill="none"
                stroke="#8b85b1"
                strokeWidth="2.2"
                strokeLinecap="round"
              />

              {/* Data Nodes & X-axis Labels */}
              {points.map((pt, idx) => (
                <g key={idx}>
                  <text
                    x={pt.x}
                    y={chartH - 8}
                    fill="#94a3b8"
                    fontSize="10"
                    fontWeight="500"
                    textAnchor="middle"
                  >
                    {pt.label}
                  </text>

                  {/* Dark Circular Node on Specific Points */}
                  {pt.isNode && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4"
                      fill="#362d59"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  )}
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="vd-card">
          <div className="vd-card-header">
            <span className="vd-section-title">Top Selling Products</span>
            <button
              type="button"
              className="vd-link-action"
              onClick={() => onNavigate?.('products')}
            >
              See All Product
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {topSelling.map((prod) => (
              <div key={prod.id} className="vd-product-item">
                <div className="vd-product-left">
                  <img src={prod.img} alt={prod.title} className="vd-product-thumb" />
                  <div className="vd-product-meta">
                    <span className="vd-product-title">{prod.title}</span>
                    <span className="vd-product-sales">{prod.sales}</span>
                  </div>
                </div>

                <div className="vd-product-right">
                  {prod.stockText && <span className="vd-stock-qty">{prod.stockText}</span>}
                  <span
                    className={
                      prod.status === 'Available' ? 'vd-status-available' : 'vd-status-outofstock'
                    }
                  >
                    • {prod.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Row 3: Product List */}
      <div className="vd-card">
        <div className="vd-card-header">
          <span className="vd-section-title">Product List</span>
          <button
            type="button"
            className="vd-btn-add"
            onClick={() => onNavigate?.('products')}
          >
            <Plus size={14} />
            <span>Add new Product</span>
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="vd-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Price</th>
                <th>QTY Available</th>
                <th>Status</th>
                <th>Sold</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {productListRows.map((row, idx) => (
                <tr key={idx} className="vd-table-row">
                  <td>
                    <div className="vd-prod-cell">
                      <img src={row.img} alt={row.name} className="vd-prod-img" />
                      <span className="vd-prod-name" title={row.name}>
                        {row.name}
                      </span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700 }}>{row.price}</td>
                  <td style={{ color: '#64748b', fontWeight: 500 }}>{row.qty}</td>
                  <td>
                    <span className="vd-status-pill">
                      <span
                        className={row.isAvailable ? 'vd-status-dot-green' : 'vd-status-dot-red'}
                      />
                      <span style={{ color: row.isAvailable ? '#10b981' : '#ef4444' }}>
                        {row.status}
                      </span>
                    </span>
                  </td>
                  <td style={{ color: '#64748b' }}>{row.sold}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className="vd-action-btn"
                      onClick={() => onNavigate?.('products')}
                      title="Manage product"
                    >
                      •••
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
