    // mock-data.js
    const mockSingleProperty = {
      id: "Tampines-Blk-123A",
      address: "Tampines Blk 123A",
      price: 881000,
      lease: "35 years",
      town: "TAMPINES",
      flat_type: "5 ROOM",
      storey_range: "04 TO 06",
      floor_area_sqm: 120.0,
      flat_model: "Improved",
      lease_commence_date: 2000,
      remaining_lease: "74 years 02 months",
      priceHistory: [
        { year: 2015, price: 780000 }, { year: 2016, price: 820000 },
        { year: 2017, price: 810000 }, { year: 2018, price: 850000 },
        { year: 2019, price: 840000 }, { year: 2020, price: 881000 }
      ],
      comments: []
    };

    const mockAreaProperties = [
      mockSingleProperty, // Include the first property in the list
      {
        id: "Tampines-Blk-456B",
        address: "Tampines Blk 456B",
        price: 733000,
        lease: "41 years",
        town: "TAMPINES",
        flat_type: "4 ROOM",
        storey_range: "07 TO 09",
        floor_area_sqm: 104.0,
        flat_model: "Model A",
        lease_commence_date: 1994,
        remaining_lease: "69 years 01 month",
        priceHistory: [],
        comments: []
      }
    ];

    module.exports = { mockSingleProperty, mockAreaProperties };
    
