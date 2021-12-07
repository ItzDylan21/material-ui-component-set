(() => ({
  name: 'Organogram',
  type: 'BODY_COMPONENT',
  allowedTypes: [],
  orientation: 'HORIZONTAL',
  jsx: (() => {
    const { env, Query, Icon } = B;
    const { gql } = window.MaterialUI;
    const [parentName, setParentName] = React.useState('CEO/VP');
    const isDev = env === 'dev';
    const GET_USERINFO = gql`
      query Item {
        allTeambridge {
          results {
            id
            childTeam {
              id
              name
              hierarchyLevel
              webusers {
                id
                firstName
                lastName
                profileImageUrl
              }
            }
            parentTeam {
              id
              name
              hierarchyLevel
            }
          }
        }
      }
    `;

    function teamClickHandler(e) {
      e.stopPropagation();
    }

    // const teamClickHandler = (e, id) => {
    //   debugger;
    //   e.preventDefault();
    //   e.stopPropagation();
    //   console.log(id);
    //   // window.location = `https://bro-intranet-dev.betty.app/profile/${id}`;
    // };

    // Creates the icon, link and name for the Card.
    const TeamList = props => {
      const { teammembers } = props;
      if (teammembers.length > 0) {
        return (
          <>
            {teammembers.map(user => (
              <>
                <a href={`/profile/${user.id}`}>
                  <div className={classes.employee}>
                    <div className={classes.employee_img}>
                      <img
                        src={user.profileImageUrl}
                        className={classes.profile_pic}
                        alt="Betty Logo"
                      />
                    </div>
                    <p>{user ? `${user.firstName} ${user.lastName}` : ' '}</p>
                  </div>
                </a>
              </>
            ))}
          </>
        );
      }
    };

    const CardManager = props => {
      const { cardData } = props;
      const [cards] = React.useState(cardData);
      console.log('1', cards);
      console.log('2', cardData);
      if (cardData.length > 0 || cards.length > 0) {
        return (
          <ul>
            {cards[0].childArray.map(card => (
              <Card cardData={card} />
            ))}
          </ul>
        );
      }
      return <a>hello world</a>;
    };
    B.defineFunction('Set Top Level Value', evt =>
      setParentName(evt.target.innerText),
    );
    const Card = props => {
      const { cardData } = props;
      const [childVisibility, setChildVisibility] = React.useState(true);
      const toggleTeamList = props => {
        setChildVisibility(childVisibility => !childVisibility);
      };
      const visibilityCheck = childVisibility => {
        {
          childVisibility ? (
            <Icon onClick={toggleTeamList} name="ExpandMore" />
          ) : (
            <Icon onClick={toggleTeamList} name="ExpandLess" />
          );
        }
      };
      if (cardData) {
        return (
          <li key={cardData.id}>
            <span>
              <div>
                <h4>{cardData.childName}</h4>
                {cardData.childArray.length > 0 ? (
                  childVisibility ? (
                    <Icon onClick={toggleTeamList} name="ExpandMore" />
                  ) : (
                    <Icon onClick={toggleTeamList} name="ExpandLess" />
                  )
                ) : null}
              </div>
              <div className={classes.employee_list}>
                {cardData.childWebusers.length > 0 && (
                  <>
                    <hr />
                    <TeamList teammembers={cardData.childWebusers} />
                  </>
                )}
              </div>
            </span>
            {childVisibility
              ? cardData.childArray.length > 0 && (
                  <ul>
                    {cardData.childArray.map(child => (
                      <Card cardData={child} visibility={childVisibility} />
                    ))}
                  </ul>
                )
              : null}
          </li>
        );
      }
      return <> </>;
    };
    function SortJSON(data, ToplevelName) {
      const teams = [];
      const jsonObj = [];
      data.allTeambridge.results.forEach(newTeam => {
        const teamObject = {
          id: newTeam.id,
          childId: newTeam.childTeam.id,
          childName: newTeam.childTeam.name,
          parentName: newTeam.parentTeam.name,
          childHierarchyLevel: newTeam.childTeam.hierarchyLevel,
          childWebusers: newTeam.childTeam.webusers,
          childArray: [],
        };
        // You now have a single dimension array of individual objects.
        teams.push(teamObject);
      });

      // Find all child-teams of a team
      teams.forEach(child => {
        if (child.parentName) {
          if (
            teams.find(
              x =>
                x.childName === child.parentName &&
                child.parentName !== child.childName,
            )
          ) {
            const parentObj = teams.find(x => x.childName === child.parentName);
            parentObj.childArray.push(child);
          }
        }
        if (parentObj) {
          jsonObj.push(parentObj);
        }
      });

      // const uniqueObj is an Array
      const uniqueObj = new Set();
      const result = jsonObj.filter(el => {
        if (el.childHierarchyLevel === 0) {
          // adds the id to the Set (Array)
          // check if the Set already contains this id
          // if the id is in the array, it drops the record. If the id is not in the array, it adds the record to the Array.
          const duplicate = uniqueObj.has(el.id);
          uniqueObj.add(el.id);
          return !duplicate;
        }
        return false;
      });
      const formattedTopLvl = ToplevelName.toUpperCase().trim();
      if (ToplevelName)
        return result.filter(
          x => x.childName.toUpperCase() === formattedTopLvl,
        );
    }

    // Creates a card that recursively loops through all cards using a GraphQL query.
    function LoadCards() {
      return (
        <Query fetchPolicy="network-only" query={GET_USERINFO}>
          {({ loading, error, data }) => {
            if (loading) {
              return 'Loading...';
            }
            if (error) {
              return `Error! ${error.Message}`;
            }
            const result = SortJSON(data, parentName);
            return (
              <div className={classes.org_tree}>
                <CardManager cardData={result} />
              </div>
            );
          }}
        </Query>
      );
    }
    if (isDev) {
      return (
        <div className={classes.org_tree}>
          <ul>
            <li>
              <span>
                <div>
                  <h4>model.childName</h4>
                  <Icon name="ExpandMore" />
                </div>
                <hr />
                <div className={classes.employee}>
                  <div className={classes.employee_img}>
                    <img
                      src=""
                      className={classes.profile_pic}
                      alt="Betty Logo"
                    />
                  </div>
                  <p>user.Fullname</p>
                </div>
                <div className={classes.employee}>
                  <div className={classes.employee_img}>
                    <img
                      src=""
                      className={classes.profile_pic}
                      alt="Betty Logo"
                    />
                  </div>
                  <p>user.Fullname</p>
                </div>
              </span>
            </li>
          </ul>
        </div>
      );
    }
    return LoadCards();
  })(),
  styles: () => () => ({
    body: {
      paddingLeft: '10px',
      fontFamily: '"Ubuntu", sans-serif',
    },
    '*': {
      margin: '0',
      padding: '0',
    },
    a: {
      textDecoration: 'none',
      color: 'rgb(0, 0, 0)',
    },
    org_tree: {
      display: 'flex',
      justifyContent: 'center',
      paddingTop: '10px',
      '& ul': {
        position: 'relative',
        padding: '1em 0',
        margin: '0 auto',
        textAlign: 'center',
        whiteSpace: 'nowrap',
      },
      '& ul:first-child': {
        overflow: 'auto',
      },
      '& ul::after': {
        content: '""',
        display: 'table',
        clear: 'both',
      },
      '& li': {
        display: 'inline-block',
        verticalAlign: 'top',
        textAlign: 'center',
        listStyleType: 'none',
        position: 'relative',
        padding: '1em 0.5em 0 0.5em',
      },
      '& li::before, & li::after': {
        content: '""',
        position: 'absolute',
        top: '0',
        right: '50%',
        borderTop: '1px solid #ccc',
        width: '50%',
        height: '16px',
      },
      '& li::after': {
        right: 'auto',
        left: '50%',
        borderLeft: '1px solid #ccc',
      },
      '& li:only-child::after, & li:only-child::before': {
        display: 'none',
      },
      '& li:only-child': {
        padding: '0',
      },
      '& li:only-child span': {
        top: '0',
      },
      '& li:first-child::before, & li:last-child::after': {
        border: '0 none',
      },
      '& li:last-child::before': {
        borderRight: '1px solid #ccc',
        borderRadius: '0 5px 0 0',
      },
      '& li:first-child::after': {
        borderRadius: '5px 0 0 0',
      },
      '& li span:not(:last-child) div:first-child': {
        cursor: 'pointer',
      },
      '& ul ul::before': {
        content: '""',
        position: 'absolute',
        top: '0',
        left: '50%',
        borderLeft: '1px solid #ccc',
        width: '0',
        height: '1em',
      },
      '& li span': {
        border: '1px solid #ccc',
        padding: '0.5em 0.75em',
        textDecoration: 'none',
        display: 'inline-block',
        borderRadius: '5px',
        color: '#333',
        position: 'relative',
        top: '1px',
        width: '200px',
        whiteSpace: 'normal',
        cursor: 'default',
        boxShadow: '0px 0px 3px 1px #e5e5e5',
        zIndex: '2',
        background: '#fff',
      },
      '& li span:hover, & li span:hover + ul li span': {
        background: '#e5104d',
        color: '#fff',
        border: '1px solid #e5104d',
      },
      '& li span:hover a div': {
        color: '#fff',
      },
      '& li span:hover + ul li span a div, & li span:hover p': {
        color: '#fff',
      },
      '& li span:hover + ul li span hr, & li span:hover hr': {
        borderColor: '#fff',
      },
      '& li span:hover + ul li::after, & li span:hover + ul li::before, & li span:hover + ul::before, & li span:hover + ul ul::before': {
        borderColor: '#e5104d',
      },
      '& li span h4': {
        fontSize: '14px',
        margin: '0',
        padding: '0.5em 0',
      },
    },
    profile_pic: {
      width: '35px',
      height: '35px',
      flexShrink: '0',
      objectFit: 'cover',
      borderRadius: '50%',
    },
    employee: {
      display: 'flex',
      alignItems: 'center',
      fontSize: '12px',
      marginBottom: '2px',
    },
    employee_img: {
      borderRadius: '100%',
      position: 'relative',
      '&::after': {
        position: 'absolute',
        content: '""',
        boxShadow: 'inset 0 0 0 2px #fff, 0px 0px 2px 0px #999',
        borderRadius: '50%',
      },
    },
    img: {
      verticalAlign: 'middle',
      borderStyle: 'none',
    },
    employee_list: {
      padding: '0.5em 0 0 0.4em',
      '& a': {
        textDecoration: 'none',
        color: 'black',
      },
    },
  }),
}))();
