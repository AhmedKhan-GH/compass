library ieee;
use ieee.std_logic_1164.all;

entity top_module is
    port (
        request : in std_logic;
        blocked : in std_logic;
        fan_on : out std_logic;
        fault : out std_logic
    );
end entity;

architecture rtl of top_module is
begin
    -- TODO: implement the required behavior.
    fan_on <= '0';
    fault <= '0';
end architecture;
