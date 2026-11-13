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
    -- Faulty controller: ending a request leaves the previous outputs visible.
    process(all)
    begin
        if request = '1' then
            if blocked = '1' then
                fan_on <= '0';
                fault <= '1';
            else
                fan_on <= '1';
                fault <= '0';
            end if;
        end if;
    end process;
end architecture;
