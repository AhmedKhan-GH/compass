library ieee;
use ieee.std_logic_1164.all;

entity top_module is
    port (
        digit : in std_logic_vector(3 downto 0);
        segments : out std_logic_vector(6 downto 0);
        valid : out std_logic
    );
end entity;

architecture rtl of top_module is
begin
    -- TODO: implement the required behavior.
    segments <= (others => '0');
    valid <= '0';
end architecture;
