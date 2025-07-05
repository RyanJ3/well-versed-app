// Sample journey data for testing/reference
// This should be loaded from the API in production

export const SAMPLE_JOURNEYS = {
  wilderness: {
    name: 'Wilderness Wanderings',
    description: 'The 40-year journey of the Israelites from Egypt to the Promised Land',
    color: '#8B4513',
    events: [
      {
        title: 'The Exodus Begins',
        description: 'The Israelites departed from Rameses after the Passover.',
        scriptures: ['Exodus 12:37', 'Numbers 33:3-5'],
        visualEffect: 'divine-light' as const
      },
      {
        title: 'Crossing the Red Sea',
        description: 'God parted the Red Sea for Israel to cross on dry ground.',
        scriptures: ['Exodus 14:21-22'],
        visualEffect: 'divine-light' as const
      },
      {
        title: 'Receiving the Law',
        description: 'Moses received the Ten Commandments at Mount Sinai.',
        scriptures: ['Exodus 19-20'],
        visualEffect: 'divine-light' as const
      }
    ]
  },
  paulFirst: {
    name: "Paul's First Missionary Journey",
    description: 'Paul and Barnabas spread the Gospel through Cyprus and Asia Minor (AD 46-48)',
    color: '#4169E1',
    events: [
      {
        title: 'Commissioned by the Church',
        description: 'The Holy Spirit called Paul and Barnabas to missionary work.',
        scriptures: ['Acts 13:1-3']
      },
      {
        title: 'Confronting Bar-Jesus',
        description: 'Paul struck the sorcerer blind, leading to the proconsul's conversion.',
        scriptures: ['Acts 13:6-12'],
        visualEffect: 'miracle' as const
      },
      {
        title: 'Stoned at Lystra',
        description: 'Paul was stoned and left for dead but miraculously recovered.',
        scriptures: ['Acts 14:19-20'],
        visualEffect: 'miracle' as const
      }
    ]
  },
  jesusMinistry: {
    name: 'Ministry of Jesus',
    description: 'The earthly ministry of Jesus Christ from birth to resurrection',
    color: '#FFD700',
    events: [
      {
        title: 'Birth in Bethlehem',
        description: 'The Savior is born in the city of David.',
        scriptures: ['Luke 2:1-20', 'Matthew 2:1-12'],
        visualEffect: 'divine-light' as const
      },
      {
        title: 'Baptism in the Jordan',
        description: 'Jesus is baptized by John and the Spirit descends.',
        scriptures: ['Matthew 3:13-17', 'Mark 1:9-11'],
        visualEffect: 'divine-light' as const
      },
      {
        title: 'Transfiguration',
        description: 'Jesus is transfigured before Peter, James, and John.',
        scriptures: ['Matthew 17:1-8', 'Mark 9:2-8'],
        visualEffect: 'divine-light' as const
      }
    ]
  }
};